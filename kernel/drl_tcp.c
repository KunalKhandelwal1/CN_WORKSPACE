#include <linux/module.h>
#include <linux/netlink.h>
#include <linux/skbuff.h>
#include <net/sock.h>
#include <net/tcp.h>
#include <linux/timer.h>

#define NETLINK_DRLTCP 31
#define DRLTCP_MCGRP 1
#define MAX_NL_FAILS 10
#define CWND_SLEW_LIMIT 10
#define BATCH_SIZE 5  /* Only send Netlink message every 5 packets */

static struct sock *nl_sk = NULL;

/* Custom state per socket */
struct drltcp_data {
    u32 nl_fails;
    u32 fallback_mode;
    u32 packets_since_last_nl;
    u32 target_cwnd;
};

/* Netlink Message Payload */
struct drltcp_nl_msg {
    u32 snd_cwnd;
    u32 srtt_us;
    u32 bytes_acked;
    u32 socket_id;
};

static void drltcp_send_nl_msg(struct sock *sk, const struct tcp_sock *tp, struct drltcp_data *ca)
{
    struct sk_buff *skb_out;
    struct nlmsghdr *nlh;
    struct drltcp_nl_msg *msg;
    int res;

    if (!nl_sk || ca->fallback_mode)
        return;

    skb_out = nlmsg_new(sizeof(struct drltcp_nl_msg), GFP_NOWAIT);
    if (!skb_out) {
        ca->nl_fails++;
        goto check_fails;
    }

    nlh = nlmsg_put(skb_out, 0, 0, NLMSG_DONE, sizeof(struct drltcp_nl_msg), 0);
    msg = nlmsg_data(nlh);
    msg->snd_cwnd = tp->snd_cwnd;
    msg->srtt_us = tp->srtt_us >> 3; /* convert from 8-times scaled to actual */
    msg->bytes_acked = tp->bytes_acked;
    msg->socket_id = (u32)(unsigned long)sk;

    /* Multicast the message */
    res = nlmsg_multicast(nl_sk, skb_out, 0, DRLTCP_MCGRP, GFP_NOWAIT);
    if (res < 0) {
        ca->nl_fails++;
    } else {
        ca->nl_fails = 0; /* reset on success */
    }

check_fails:
    if (ca->nl_fails > MAX_NL_FAILS) {
        printk_ratelimited(KERN_WARNING "DRL-TCP: Netlink buffer saturated. Falling back to AIMD.\n");
        ca->fallback_mode = 1;
    }
}

static void drltcp_init(struct sock *sk)
{
    struct drltcp_data *ca = inet_csk_ca(sk);
    ca->nl_fails = 0;
    ca->fallback_mode = 0;
    ca->packets_since_last_nl = 0;
    ca->target_cwnd = tcp_sk(sk)->snd_cwnd;
}

static void drltcp_cong_avoid(struct sock *sk, u32 ack, u32 acked)
{
    struct tcp_sock *tp = tcp_sk(sk);
    struct drltcp_data *ca = inet_csk_ca(sk);

    /* AIMD Fallback */
    if (ca->fallback_mode) {
        tcp_reno_cong_avoid(sk, ack, acked);
        return;
    }

    ca->packets_since_last_nl += acked;

    /* Batching: Send to Netlink every BATCH_SIZE packets */
    if (ca->packets_since_last_nl >= BATCH_SIZE) {
        drltcp_send_nl_msg(sk, tp, ca);
        ca->packets_since_last_nl = 0;
    }

    /* Slew Rate Limiter: Gradually step towards target_cwnd */
    if (tp->snd_cwnd < ca->target_cwnd) {
        u32 delta = ca->target_cwnd - tp->snd_cwnd;
        if (delta > CWND_SLEW_LIMIT)
            delta = CWND_SLEW_LIMIT;
        tp->snd_cwnd += delta;
    } else if (tp->snd_cwnd > ca->target_cwnd) {
        u32 delta = tp->snd_cwnd - ca->target_cwnd;
        if (delta > CWND_SLEW_LIMIT)
            delta = CWND_SLEW_LIMIT;
        tp->snd_cwnd -= delta;
    }
}

static void drltcp_nl_recv_msg(struct sk_buff *skb)
{
    struct nlmsghdr *nlh;
    u32 *data;
    struct sock *sk;
    struct drltcp_data *ca;
    
    nlh = (struct nlmsghdr *)skb->data;
    if (nlh->nlmsg_len < nlmsg_msg_size(sizeof(u32) * 2))
        return;

    /* Payload format expected from Python: [socket_id, target_cwnd] */
    data = (u32 *)nlmsg_data(nlh);
    sk = (struct sock *)(unsigned long)data[0];
    
    /* We don't have a safe way to lookup the socket directly by raw pointer from user space safely in production,
       but for this demo we assume it's valid. In reality, a proper lookup by 4-tuple is required. */
    if (!sk) return;
    
    /* Update the target cwnd, the cong_avoid loop will handle slew limiting */
    ca = inet_csk_ca(sk);
    if (ca && !ca->fallback_mode) {
        ca->target_cwnd = data[1];
    }
}

static struct tcp_congestion_ops drltcp_ops = {
    .init           = drltcp_init,
    .ssthresh       = tcp_reno_ssthresh,
    .undo_cwnd      = tcp_reno_undo_cwnd,
    .cong_avoid     = drltcp_cong_avoid,
    .owner          = THIS_MODULE,
    .name           = "drltcp",
};

static int __init drltcp_register(void)
{
    struct netlink_kernel_cfg cfg = {
        .input = drltcp_nl_recv_msg,
    };

    nl_sk = netlink_kernel_create(&init_net, NETLINK_DRLTCP, &cfg);
    if (!nl_sk) {
        printk(KERN_ERR "DRL-TCP: Error creating socket.\n");
        return -ENOMEM;
    }

    BUILD_BUG_ON(sizeof(struct drltcp_data) > ICSK_CA_PRIV_SIZE);
    
    printk(KERN_INFO "DRL-TCP: Registered TCP Congestion Control.\n");
    return tcp_register_congestion_control(&drltcp_ops);
}

static void __exit drltcp_unregister(void)
{
    tcp_unregister_congestion_control(&drltcp_ops);
    if (nl_sk) {
        netlink_kernel_release(nl_sk);
    }
    printk(KERN_INFO "DRL-TCP: Unregistered TCP Congestion Control.\n");
}

module_init(drltcp_register);
module_exit(drltcp_unregister);

MODULE_AUTHOR("DRL-TCP Team");
MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Live DRL-TCP Kernel Controller via Netlink");
