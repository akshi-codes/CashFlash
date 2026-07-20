import logoBlack from "@/assets/cashflash-logos/logo-black.png";
import logoWhite from "@/assets/cashflash-logos//logo-white.png";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { appConfig } from "@/config/appConfig";

const Logo = () => (
  <>
    <img
      src={logoBlack}
      alt="Logo"
      className="block h-6 w-auto object-contain dark:hidden"
    />
    <img
      src={logoWhite}
      alt="Logo"
      className="hidden h-6 w-auto object-contain dark:block"
    />
  </>
);

export default function LoginPage() {
  return (
    <div className="flex max-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="fixed top-4 right-4 z-50">
        <ModeToggle className="w-8 h-8" />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href={appConfig.routes.landing}
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex items-center justify-center">
            <Logo />
          </div>
          CashFlash Inc.
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
