import { BrandFooter, BrandHeader } from "./brand-shell";
import { TalentMark } from "./marks";

export const TalentHeader = ({ portal = false }: { portal?: boolean }) => (
  <BrandHeader
    mark={<TalentMark />}
    home="/talent"
    portal={portal}
    login="/talent/login"
    nav={[
      ["Open roles", "/talent/jobs"],
      ["How we hire", "/talent#how"],
      ["Team builds", "/talent#teams"],
      ["For employers", "/talent#hire"],
    ]}
    cta={["Hire with us", "/talent#hire"]}
    className="bg-card-2"
  />
);

export const TalentFooter = () => <BrandFooter mark={<TalentMark />} line="Mid-senior and specialist hiring for scale-ups and global capability centres. Part of Benchmark HR Group." contact="hiring@benchmarktalent.in" />;
