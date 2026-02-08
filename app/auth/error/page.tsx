import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-2xl text-card-foreground">
              Sorry, something went wrong.
            </CardTitle>
          </CardHeader>
          <CardContent>
            {params?.error ? (
              <p className="text-sm text-muted-foreground">
                Code error: {params.error}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                An unspecified error occurred.
              </p>
            )}
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
