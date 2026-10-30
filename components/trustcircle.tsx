import { BrandFooter, BrandHeader } from "./brand-shell";
import { TrustCircleMark } from "./marks";

export const TCHeader = ({ portal = false }: { portal?: boolean }) => (
  <BrandHeader
    mark={<TrustCircleMark />}
    home="/trustcircle"
    portal={portal}
    login="/trustcircle/login"
    nav={[
      ["The programme", "/trustcircle#programme"],
      ["For companies", "/trustcircle#sponsor"],
      ["For people", "/trustcircle#talk"],
    ]}
    cta={["Talk to a coach", "/trustcircle#talk"]}
  />
);

export const TCFooter = () => <BrandFooter mark={<TrustCircleMark />} line="Career transition for leaders and teams going through restructuring or change. Part of Benchmark HR Group." contact="hello@trustcircle.in" />;
