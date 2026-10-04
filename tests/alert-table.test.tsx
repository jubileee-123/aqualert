import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertTable } from "@/components/alerts/alert-table";
import { filterAlerts } from "@/components/alerts/alerts-view";
import { summariseDelivery } from "@/components/alerts/notification-log-table";
import type { NotificationLog } from "@/types";
import { alert } from "./fixtures";

const alerts = [
  alert(),
  alert({ alertId: "ALT-KAN-20261004T0900", siteId: "kaneshie", alertStatus: "WATCH", previousAlertStatus: "NORMAL", triggerReason: "Rainfall 34 mm/hr sustained" }),
];
const siteNames = { alajo: "Alajo", kaneshie: "Kaneshie" };

describe("AlertTable", () => {
  it("renders the required columns and a row per alert", () => {
    render(<AlertTable alerts={alerts} siteNames={siteNames} onSelect={() => {}} />);
    for (const col of ["Alert ID", "Time (UTC)", "Location", "Status", "Trigger reason", "Actions"]) {
      expect(screen.getByRole("columnheader", { name: col })).toBeInTheDocument();
    }
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText("Alajo")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("Warning")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("04 Oct, 10:00 UTC")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("from Normal")).toBeInTheDocument();
  });

  it("selects an alert from the View button or a row click", async () => {
    const onSelect = vi.fn();
    render(<AlertTable alerts={alerts} siteNames={siteNames} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "View alert ALT-KAN-20261004T0900" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith("ALT-KAN-20261004T0900");
    await userEvent.click(screen.getByText("ALT-ALA-20261004T1000"));
    expect(onSelect).toHaveBeenLastCalledWith("ALT-ALA-20261004T1000");
  });
});

describe("alert filtering", () => {
  it("filters by level and searches alert ID or site name", () => {
    expect(filterAlerts(alerts, { level: "WARNING", query: "" }, siteNames).map((a) => a.siteId)).toEqual(["alajo"]);
    expect(filterAlerts(alerts, { level: "all", query: "kane" }, siteNames)).toHaveLength(1);
    expect(filterAlerts(alerts, { level: "all", query: "t1000" }, siteNames)[0]?.alertId).toBe("ALT-ALA-20261004T1000");
  });
});

describe("delivery traceability", () => {
  const log = (o: Partial<NotificationLog>): NotificationLog => ({
    notificationId: "n",
    alertId: "a",
    channel: "SMS",
    recipientGroup: "RESIDENTS",
    sentAtUtc: "2026-10-04T10:00:10Z",
    notificationStatus: "DELIVERED",
    messageText: "",
    providerReference: "SMSGW-1",
    recipientCount: 10,
    ...o,
  });

  it("counts a failed send followed by a delivered retry as reached", () => {
    const s = summariseDelivery([
      log({ notificationStatus: "FAILED" }),
      log({ sentAtUtc: "2026-10-04T10:01:10Z" }),
      log({ channel: "WHATSAPP", recipientGroup: "LEADERS", notificationStatus: "SENT" }),
    ]);
    expect(s).toMatchObject({ targets: 2, delivered: 1, pending: 1, failed: 0, retries: 1, hasSms: true, hasWhatsApp: true });
  });
});
