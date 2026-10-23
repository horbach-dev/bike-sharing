import { CoinLogo } from "@/widgets/nhacoin";
import { WebBackButton } from "@/shared/ui/web-back-button";

export function ServiceHeader() {
  return (
    <header className="service-top">
      <WebBackButton className="service-back" />
      <CoinLogo />
    </header>
  );
}
