import TicketDetail from "./TicketDetail";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <TicketDetail />;
}
