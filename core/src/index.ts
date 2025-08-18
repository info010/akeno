import { security } from "./security/security";
import { monitoring } from "./monitoring/monitor";
import { loadBalancer } from "./load/load";

export const Akeno = {
  security,
  monitoring,
  loadBalancer
};

export default Akeno;