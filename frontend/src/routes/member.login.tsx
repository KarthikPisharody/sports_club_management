import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UserCheck, ArrowLeft, Lock, Mail, User, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/member/login")({
  head: () => ({
    meta: [
      { title: "Member Sign-In — ArenaOne Sports Club" },
      { name: "description", content: "Sign in with your member username, email, and password to access booking and equipment." },
    ],
  }),
  component: MemberLoginPage,
});

function MemberLoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error("Please enter your username.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }
    if (!password.trim()) {
      toast.error("Please enter your password.");
      return;
    }

    const result = login({
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: "member",
    });

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(`Welcome back, ${username.trim()}!`, {
      description: "Signed in to Member Portal. Full booking & equipment checkout enabled.",
    });

    void navigate({ to: "/member" });
  };

  return (
    <div className="mx-auto max-w-md py-10 px-4">
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Portal Selection
      </Link>

      <Card className="border-2 border-primary/40 shadow-card">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-2">
            <UserCheck className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold font-display">Member Portal Sign-In</CardTitle>
          <CardDescription className="text-xs">
            Enter your credentials to access venue booking and equipment loans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="member-username">Username</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="member-username"
                  placeholder="e.g. Aarav Mehta"
                  className="pl-8"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="member-email"
                  type="email"
                  placeholder="aarav.mehta@clubmail.com"
                  className="pl-8"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="member-phone"
                  type="tel"
                  placeholder="+91 9820011223"
                  className="pl-8"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="member-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-8"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2">
              Sign In as Member
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
          <p>
            Don't have a membership?{" "}
            <Link to="/other" className="text-primary font-semibold hover:underline">
              Continue as Guest
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
