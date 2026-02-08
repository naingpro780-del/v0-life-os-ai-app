import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-2xl text-card-foreground">
              Thank you for signing up!
            </CardTitle>
            <CardDescription>Check your email to confirm</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {"You've successfully signed up. Please check your email to confirm your account before signing in."}
            </p>
            <Link
              href="/auth/login"
              className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
            >
              Back to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
