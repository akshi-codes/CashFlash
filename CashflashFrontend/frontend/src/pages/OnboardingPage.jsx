/* eslint-disable react-refresh/only-export-components */
import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  ArrowLeft,
  BookOpen,
  Building,
  Building2,
  CircleDashed,
  Code2,
  Download,
  Megaphone,
  Palette,
  Rocket,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChoiceGroup,
  FeatureCarousel,
  Onboarding,
  TipsList,
  useOnboarding } from "@/components/ui/onboarding"
import { appConfig } from "@/config/appConfig"
import { markOnboardingCompleted, shouldShowOnboarding } from "@/features/auth/utils/onboardingStatus"


const STEP_CONFIG = [
  {
    title: "Welcome to CashFlash",
    description: "Move money faster, manage payments smarter, and get set up in a few quick steps.",
  },
  {
    title: "Shape Your CashFlash Experience",
    description: "Tell us how you plan to use CashFlash so the experience feels more relevant from day one.",
  },
  {
    title: "You Are Ready to Go",
    description: "A few quick pointers before you jump into transfers, requests, and wallet activity.",
  },
]

export const FEATURES = [
  {
    id: "wallet-control",
    icon: Code2,
    title: "Wallet, Bank, and Card Control",
    description:
      "Keep your wallet balance, linked bank accounts, and saved cards in one place for faster payments.",
    image: "/component-images/onboarding/onboarding-source-code.png",
  },
  {
    id: "smart-payments",
    icon: BookOpen,
    title: "Requests, Transfers, and Tracking",
    description:
      "Send money, request payments, and review recent activity without hopping across different screens.",
    image: "/component-images/onboarding/onboarding-skills.png",
  },
  {
    id: "insights",
    icon: Download,
    title: "Built for Everyday Payment Flow",
    description:
      "CashFlash helps you stay on top of spending, account activity, and payment actions with less friction.",
    image: "/component-images/onboarding/onboarding-nextjs.png",
  },
]

export const ROLES = [
  { id: "designer", label: "Designer", icon: Palette },
  { id: "founder", label: "Founder", icon: Rocket },
  { id: "sales", label: "Sales", icon: TrendingUp },
  { id: "freelancer", label: "Freelancer", icon: Building2 },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "developer", label: "Developer", icon: Code2 },
  { id: "agency", label: "Agency", icon: Building },
  { id: "other", label: "Other", icon: CircleDashed },
]

export const GOALS = [
  { id: "send-money", label: "Fast personal transfers" },
  { id: "request-money", label: "Payment requests" },
  { id: "merchant-payments", label: "Merchant collections" },
  { id: "wallet-usage", label: "Wallet-first payments" },
  { id: "expense-tracking", label: "Track payment activity" },
  { id: "other", label: "A mix of everything" },
]

export const TIPS = [
  {
    number: 1,
    text: "Link the payment methods you use most often first so transfers and top-ups feel quicker later.",
  },
  {
    number: 2,
    text: "Set a default bank account or card to reduce friction when you add money, withdraw, or pay.",
  },
  {
    number: 3,
    text: "Review transaction history and notifications often so you can spot failed or pending actions early.",
  },
]

export const TOTAL_STEPS = 3
export const MAX_STEP_VALUE = FEATURES.length - 1

export default function OnboardingDemo() {
  return <HeadlessOnboardingDemo />
}

export function HeadlessOnboardingDemo() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [open, setOpen] = useState(true)
  const [selectedRole, setSelectedRole] = useState(undefined)
  const [selectedGoal, setSelectedGoal] = useState(undefined)

  if (!user?.email) {
    return <Navigate to={appConfig.routes.login} replace />
  }

  if (!shouldShowOnboarding(user.email)) {
    return <Navigate to={appConfig.routes.dashboard} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-3 py-6">
      <Dialog
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true)
          }
        }}
        open={open}
      >
        <DialogContent
          className="w-full max-w-[calc(100dvw-1.5rem)] border-none bg-transparent p-0 shadow-none sm:max-w-4xl"
        >
          <div className="relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-background/80 p-1 shadow-2xl backdrop-blur-xl md:p-2">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-32 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-6 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
            <Onboarding
              canGoNext={(step) =>
                step === 1 ||
                (step === 2 && selectedGoal !== null) ||
                step === 3
              }
              className="relative min-h-170 overflow-hidden border-white/10 bg-card/85 px-5 py-6 shadow-none sm:px-7 sm:py-7"
              maxStepValue={MAX_STEP_VALUE}
              onComplete={() => {
                markOnboardingCompleted(user.email)
                setOpen(false)
                navigate(appConfig.routes.dashboard, { replace: true })
              }}
              totalSteps={3}
            >
              <HeadlessOnboardingHeader />
              <div className="my-8 min-h-70">
                <Onboarding.Step step={1}>
                  <HeadlessFeatureStep />
                </Onboarding.Step>
                <Onboarding.Step step={2}>
                  <HeadlessRoleStep
                    onGoalSelect={setSelectedGoal}
                    onRoleSelect={setSelectedRole}
                    selectedGoal={selectedGoal}
                    selectedRole={selectedRole}
                  />
                </Onboarding.Step>
                <Onboarding.Step step={3}>
                  <HeadlessTipsStep />
                </Onboarding.Step>
              </div>
              <Onboarding.Navigation completeLabel="Enter CashFlash" />
            </Onboarding>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HeadlessOnboardingHeader() {
  const { currentStep } = useOnboarding()
  const config = STEP_CONFIG[currentStep - 1]

  return (
    <DialogHeader className="text-center!">
      <DialogTitle className="font-semibold tracking-tighter text-foreground md:text-3xl">
        {config.title}
      </DialogTitle>
      <DialogDescription className="text-muted-foreground md:text-base">
        {config.description}
      </DialogDescription>
      <div className="pt-3">
        <Onboarding.StepIndicator />
      </div>
    </DialogHeader>
  )
}

function HeadlessFeatureStep() {
  const { stepValue, setStepValue } = useOnboarding()

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      <FeatureCarousel
        className="order-2 flex w-full flex-col gap-3 md:order-1 md:w-1/2"
        onValueChange={setStepValue}
        totalItems={FEATURES.length}
        value={stepValue}
      >
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon
          const isActive = stepValue === index

          return (
            <FeatureCarousel.Item index={index} key={feature.id}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                  isActive
                    ? "border-primary/30 bg-primary/10"
                    : "border-transparent hover:bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {feature.title}
                  </p>
                  {isActive && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  )}
                </div>
              </div>
            </FeatureCarousel.Item>
          )
        })}
      </FeatureCarousel>
      <div className="order-1 w-full md:order-2 md:w-1/2">
        <div className="relative aspect-4/3 overflow-hidden rounded-xl border bg-muted">
          <img
            alt={FEATURES[stepValue].title}
            className="h-full w-full object-cover transition-opacity duration-300"
            src={FEATURES[stepValue].image}
          />
        </div>
      </div>
    </div>
  )
}

function HeadlessRoleStep({
  selectedRole,
  onRoleSelect,
  selectedGoal,
  onGoalSelect,
}) {
  const { handleNext } = useOnboarding()
  const [question, setQuestion] = useState(selectedGoal ? 2 : 1)

  return (
    <div className="flex flex-col gap-4">
      {question === 1 ? (
        <div className="flex flex-col gap-4" key="q1">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-6 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              1
            </span>
            <span className="text-base font-medium text-foreground">
              Which role feels closest to you?
            </span>
          </div>
          <ChoiceGroup
            className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3"
            name="Select your role"
            onValueChange={(v) => {
              onRoleSelect(v)
              setTimeout(() => setQuestion(2), 300)
            }}
            orientation="grid"
            value={selectedRole}
          >
            {ROLES.map((role) => {
              const Icon = role.icon
              const isSelected = selectedRole === role.id

              return (
                <ChoiceGroup.Item
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200",
                    isSelected
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                  key={role.id}
                  value={role.id}
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span>{role.label}</span>
                </ChoiceGroup.Item>
              )
            })}
          </ChoiceGroup>
          <p className="text-sm text-muted-foreground">Question 1 of 2</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4" key="q2">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-6 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
              2
            </span>
            <span className="text-base font-medium text-foreground">
              What will you use CashFlash for most?
            </span>
          </div>
          <ChoiceGroup
            className="grid grid-cols-2 gap-2 sm:gap-3"
            name="Select your goal"
            onValueChange={(v) => {
              onGoalSelect(v)
              setTimeout(() => handleNext(), 300)
            }}
            orientation="grid"
            value={selectedGoal}
          >
            {GOALS.map((goal) => {
              const isSelected = selectedGoal === goal.id

              return (
                <ChoiceGroup.Item
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200",
                    isSelected
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                  key={goal.id}
                  value={goal.id}
                >
                  <span>{goal.label}</span>
                </ChoiceGroup.Item>
              )
            })}
          </ChoiceGroup>
          <div className="flex items-center justify-between">
            <Button
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setQuestion(1)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <ArrowLeft className="size-4" />
              Back to question 1
            </Button>
            <p className="text-sm text-muted-foreground">Question 2 of 2</p>
          </div>
        </div>
      )}
    </div>
  )
}

function HeadlessTipsStep() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
      <div className="order-2 w-full md:order-1 md:w-1/2">
        <TipsList
          className="flex h-full flex-col **:data-[slot=tips-list-title]:not-sr-only **:data-[slot=tips-list-title]:mb-4 **:data-[slot=tips-list-title]:text-xs **:data-[slot=tips-list-title]:font-semibold **:data-[slot=tips-list-title]:uppercase **:data-[slot=tips-list-title]:tracking-wider **:data-[slot=tips-list-title]:text-muted-foreground **:data-[slot=tips-list-items]:flex **:data-[slot=tips-list-items]:h-full **:data-[slot=tips-list-items]:flex-col **:data-[slot=tips-list-items]:justify-between **:data-[slot=tips-list-items]:gap-4"
          title="Tips"
        >
          {TIPS.map((tip) => (
            <TipsList.Item
              className="flex items-start gap-3 **:data-[slot=tips-list-item-number]:inline-flex **:data-[slot=tips-list-item-number]:size-6 **:data-[slot=tips-list-item-number]:shrink-0 **:data-[slot=tips-list-item-number]:items-center[&_[data-slot=tips-list-item-number]]:justify-center **:data-[slot=tips-list-item-number]:rounded-lg **:data-[slot=tips-list-item-number]:bg-muted **:data-[slot=tips-list-item-number]:text-sm **:data-[slot=tips-list-item-number]:text-muted-foreground"
              key={tip.number}
              number={tip.number}
            >
              <p className="text-sm leading-relaxed text-foreground">
                {tip.text}
              </p>
            </TipsList.Item>
          ))}
        </TipsList>
      </div>
      <div className="order-1 w-full md:order-2 md:w-1/2">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-background md:aspect-4/3">
          <img
            alt="Onboarding"
            className="h-full w-full object-cover"
            src="/component-images/onboarding/onboarding-tip1.png"
          />
        </div>
      </div>
    </div>
  )
}
