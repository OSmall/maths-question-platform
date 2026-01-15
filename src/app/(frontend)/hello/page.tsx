import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const metadata = {
  title: 'Hello',
  description: 'Welcome to our platform',
}

export default function HelloPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-16">
        <Badge variant="secondary">Welcome</Badge>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-foreground">Hello</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          A simple, beautiful page built with shadcn/ui components.
        </p>
      </div>

      {/* Card Section */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Explore what you can build with modern, accessible components.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page demonstrates the power of Tailwind CSS and shadcn/ui working together to
            create elegant interfaces.
          </p>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button>Learn More</Button>
          <Button variant="outline">View Docs</Button>
        </CardFooter>
      </Card>

      {/* Footer */}
      <Separator className="my-12 w-full max-w-md" />
      <p className="text-sm text-muted-foreground">Built with shadcn/ui</p>
    </div>
  )
}
