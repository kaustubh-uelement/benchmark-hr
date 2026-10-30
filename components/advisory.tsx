import { BrandFooter, BrandHeader } from "./brand-shell";
import { AdvisoryMark } from "./marks";

export const AdvHeader = ({ portal = false }: { portal?: boolean }) => (
  <BrandHeader
    mark={<AdvisoryMark />}
    home="/advisory"
    portal={portal}
    login="/advisory/login"
    nav={[
      ["Practice", "/advisory#practice"],
      ["Engagements", "/advisory#models"],
      ["Notes", "/advisory#notes"],
    ]}
    cta={["Talk to a principal", "/advisory#engage"]}
  />
);

export const AdvFooter = () => <BrandFooter mark={<AdvisoryMark />} line="People strategy, succession, policies and compliance, on retainer or as a project. Part of Benchmark HR Group." contact="advisory@benchmarkhr.in" />;
