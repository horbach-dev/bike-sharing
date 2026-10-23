import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { publicAsset } from "@/shared/lib/public-asset";
import "./nhacoin.css";

export function CoinLogo() {
  const { t } = useTranslation("wallet");

  return (
    <Link className="nhacoin-logo" to="/coins" aria-label={t("Кошелёк NhaCoin")} title={t("Кошелёк NhaCoin")}>
      <img src={publicAsset("brand/nhacoin.png")} alt="" />
    </Link>
  );
}
