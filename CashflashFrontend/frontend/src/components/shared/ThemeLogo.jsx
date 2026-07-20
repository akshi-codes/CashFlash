import logoLight from "@/assets/cashflash-logos/logo-light.png"
import logoDark from "@/assets/cashflash-logos/logo-dark.png"

export function ThemeLogo() {
  return (
    <div className="fixed top-20 left-24 z-50">
      {/* Light mode */}
      <img
        src={logoLight}
        alt="Cashflash"
        className="block h-36 w-auto object-contain drop-shadow-[0_0_6px_rgba(59,130,246,0.35)] dark:hidden"
      />

      {/* Dark mode */}
      <img
        src={logoDark}
        alt="Cashflash"
        className="hidden h-36 w-auto object-contain drop-shadow-[0_0_6px_rgba(59,130,246,0.35)] dark:block"
      />
    </div>
  )
}


