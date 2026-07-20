import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { LightBulbIcon } from "../shared/Icons";
import {
  InstagramLogoIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";
import { appConfig } from "@/config/appConfig";

export const HeroCards = () => {
  const navigate = useNavigate();

  return (
     <div className="hidden lg:flex flex-row flex-wrap gap-8 relative w-175 h-125">
      <Card className="absolute w-85 -top-3.75 drop-shadow-xl shadow-black/10 dark:shadow-white/10 landing-card-glow">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar>
            <AvatarImage src="/avatar.png" alt="" />
            <AvatarFallback>AV</AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <CardTitle className="text-lg">Akshay Shet</CardTitle>
            <CardDescription>@akshi-codes</CardDescription>
          </div>
        </CardHeader>

        <CardContent>This is fast as lightning! and secure too</CardContent>
      </Card>

      <Card className="absolute right-5 top-11 w-80 flex flex-col justify-center items-center drop-shadow-xl shadow-black/10 dark:shadow-white/10 landing-card-glow">
        <CardHeader className="mt-8 flex justify-center items-center pb-2">
          <img
            src="https://th.bing.com/th/id/OIP.zVcvI5wjK3qy-kVkhVhElAHaHa?w=180&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3"
            alt="user avatar"
            className="absolute -top-12 w-24 h-24 aspect-square rounded-full object-cover border-2 border-black dark:border-white"
          />
          <CardTitle className="text-center">SNITCH</CardTitle>
          <CardDescription className="font-normal text-primary">
            Fashionwear Company
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center pb-2">
          <p>
            We trust <span className="font-bold">cashflash</span> for our
            payments, it's cost-effecient and reliable
          </p>
        </CardContent>

        <CardFooter>
          <div>
            <a
              rel="noreferrer noopener"
              href="https://instagram.com"
              target="_blank"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
              })}
            >
              <span className="sr-only">Github icon</span>
              <InstagramLogoIcon className="w-5 h-5" />
            </a>
            <a
              rel="noreferrer noopener"
              href="https://x.com"
              target="_blank"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
              })}
            >
              <span className="sr-only">X icon</span>
              <TwitterLogoIcon className="w-5 h-5" />
            </a>

            <a
              rel="noreferrer noopener"
              href="https://www.linkedin.com"
              target="_blank"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
              })}
            >
              <span className="sr-only">Linkedin icon</span>
              <LinkedInLogoIcon size="20" />
            </a>
          </div>
        </CardFooter>
      </Card>

      <Card className="absolute top-37.5 left-12.5 w-72 drop-shadow-xl shadow-black/10 dark:shadow-white/10 landing-card-glow">
        <CardHeader>
          <CardTitle className="flex item-center justify-between">
            Merchant Account
            <Badge variant="outline" className="text-sm text-primary border-blue-600">
              New
            </Badge>
          </CardTitle>
          <div>
            <span className="text-3xl font-bold">{appConfig.values.merchantFee}</span>
            <span className="text-muted-foreground text-md">
              % /per trans for merchants
            </span>
          </div>

          <CardDescription>
            Your all-in-one destination for super fast, secure payments.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button className="w-full" onClick={() => navigate("/signup")}>
            Start your journey
          </Button>
        </CardContent>

        <div className="relative mx-4 w-64 text-center">
          <hr className="border-border my-4" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm text-muted-foreground">
            other features
          </span>
        </div>

        <CardFooter className="flex mt-7">
          <div className="space-y-4">
            {[
              "Instant digital wallet",
              "Link bank accounts securely",
              "Add debit & credit cards ",
            ].map((feature) => (
              <span key={feature} className="flex items-center">
                <Check className="text-green-500" />{" "}
                <h3 className="ml-2">{feature}</h3>
              </span>
            ))}
          </div>
        </CardFooter>
      </Card>

      <Card className="absolute w-87.5 -right-2.5 bottom-8.25  drop-shadow-xl shadow-black/10 dark:shadow-white/10 landing-card-glow">
        <CardHeader className="space-y-1 flex md:flex-row justify-start items-start gap-4">
          <div className="mt-1 bg-primary/20 p-1 rounded-2xl">
            <LightBulbIcon />
          </div>
          <div>
            <CardTitle>Light & dark mode</CardTitle>
            <CardDescription className="text-md mt-2">
              Customize your experience with Light and Dark modes. Switch
              effortlessly to ensure comfort and readability anytime.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};
