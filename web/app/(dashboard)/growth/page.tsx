"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Trophy,
  Bell,
  Share2,
  Gamepad2,
  Target,
  BarChart3,
} from "lucide-react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getPaywallMetrics,
  getRetentionMetrics,
  getReferralMetrics,
  getPushMetrics,
  getHeadlineMetrics,
} from "./actions";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subvalue?: string;
  color?: string;
}

function MetricCard({ icon, label, value, subvalue, color = "text-pitch-green" }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`font-bebas text-3xl tracking-wide ${color}`}>{value}</div>
      {subvalue && <div className="text-xs text-muted-foreground mt-1">{subvalue}</div>}
    </div>
  );
}

export default function GrowthPage() {
  const [paywall, setPaywall] = useState<Awaited<ReturnType<typeof getPaywallMetrics>> | null>(null);
  const [retention, setRetention] = useState<Awaited<ReturnType<typeof getRetentionMetrics>> | null>(null);
  const [referral, setReferral] = useState<Awaited<ReturnType<typeof getReferralMetrics>> | null>(null);
  const [push, setPush] = useState<Awaited<ReturnType<typeof getPushMetrics>> | null>(null);
  const [headlines, setHeadlines] = useState<Awaited<ReturnType<typeof getHeadlineMetrics>> | null>(null);

  useEffect(() => {
    getPaywallMetrics().then(setPaywall);
    getRetentionMetrics().then(setRetention);
    getReferralMetrics().then(setReferral);
    getPushMetrics().then(setPush);
    getHeadlineMetrics().then(setHeadlines);
  }, []);

  const loading = !paywall || !retention || !referral || !push || !headlines;

  return (
    <AdminPageShell
      title="Growth Dashboard"
      subtitle="Conversion, retention, and engagement metrics"
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Loading metrics...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Headline Metrics */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                icon={<Users className="h-4 w-4" />}
                label="Total Users"
                value={paywall.totalUsers.toLocaleString()}
                subvalue={`${paywall.activePlayers.toLocaleString()} active`}
              />
              <MetricCard
                icon={<Trophy className="h-4 w-4" />}
                label="Premium Subscribers"
                value={paywall.totalPremium.toLocaleString()}
                subvalue={`${paywall.activeConversionRate}% of active`}
                color="text-card-yellow"
              />
              <MetricCard
                icon={<Gamepad2 className="h-4 w-4" />}
                label="Total Games Played"
                value={headlines.totalGames.toLocaleString()}
                subvalue={`${headlines.gamesToday.toLocaleString()} today`}
              />
              <MetricCard
                icon={<BarChart3 className="h-4 w-4" />}
                label="Average IQ"
                value={headlines.avgIQ.toLocaleString()}
              />
            </div>
          </section>

          {/* Retention */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Retention
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              <MetricCard
                icon={<Target className="h-4 w-4" />}
                label="D1 Retention"
                value={`${retention.d1}%`}
                subvalue={`${retention.d1Active} users active today`}
                color={Number(retention.d1) > 30 ? "text-pitch-green" : "text-card-yellow"}
              />
              <MetricCard
                icon={<Target className="h-4 w-4" />}
                label="D7 Retention"
                value={`${retention.d7}%`}
                subvalue={`${retention.d7Active} active this week`}
                color={Number(retention.d7) > 20 ? "text-pitch-green" : "text-card-yellow"}
              />
              <MetricCard
                icon={<Target className="h-4 w-4" />}
                label="D30 Retention"
                value={`${retention.d30}%`}
                subvalue={`${retention.d30Active} active this month`}
                color={Number(retention.d30) > 15 ? "text-pitch-green" : "text-card-yellow"}
              />
              <MetricCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Conversion Rate"
                value={`${paywall.conversionRate}%`}
                subvalue="All users → Premium"
                color="text-card-yellow"
              />
            </div>
          </section>

          {/* Referral & Challenges */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Virality
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                icon={<Share2 className="h-4 w-4" />}
                label="Referral Codes Generated"
                value={referral.referralCodesGenerated.toLocaleString()}
              />
              <MetricCard
                icon={<Trophy className="h-4 w-4" />}
                label="Challenges Created"
                value={referral.challengesCreated.toLocaleString()}
              />
              <MetricCard
                icon={<Users className="h-4 w-4" />}
                label="Challenge Responses"
                value={referral.challengeResponses.toLocaleString()}
                subvalue={`${referral.challengeConversionRate}% response rate`}
              />
              <MetricCard
                icon={<Bell className="h-4 w-4" />}
                label="Push Devices"
                value={push.totalTokens.toLocaleString()}
              />
            </div>
          </section>

          {/* Push Notification Performance */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Push Notifications (Last 30 Days)
            </h2>
            {push.recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No notifications sent in the last 30 days
              </p>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead>Notification</TableHead>
                        <TableHead className="w-[80px] text-right">Sent</TableHead>
                        <TableHead className="w-[80px] text-right">Opens</TableHead>
                        <TableHead className="w-[80px] text-right">Open %</TableHead>
                        <TableHead className="w-[120px] text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {push.recentNotifications.map((n) => (
                        <TableRow key={n.id} className="border-white/10">
                          <TableCell>
                            <div className="font-medium text-floodlight text-sm">{n.title}</div>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {n.recipient_count ?? 0}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {n.opens}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            <span className={Number(n.openRate) > 10 ? "text-pitch-green" : "text-muted-foreground"}>
                              {n.openRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {n.sent_at ? new Date(n.sent_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </AdminPageShell>
  );
}
