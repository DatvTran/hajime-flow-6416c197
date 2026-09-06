import { Navigate } from "react-router-dom";

/** HQ production-request flow is parked; send operators to distillery partners. */
export default function HqNewProductionRequestPage() {
  return <Navigate to="/manufacturer/profiles" replace />;
}
