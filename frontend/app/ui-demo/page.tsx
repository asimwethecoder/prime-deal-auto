import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Checkbox,
  Radio,
  RadioGroup,
  DynamicIcon 
} from '@/components/ui';

export default function UIDemoPage() {
  return (
    <div className="min-h-screen bg-[#F9FBFC] py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-12">
        <div className="text-center">
          <h1 className="text-[40px] font-bold leading-[45px] text-[#050B20] mb-4">
            Prime Deal Auto UI Components
          </h1>
          <p className="text-[16px] leading-[28px] text-gray-600">
            Shared UI infrastructure based on visual ground truth
          </p>
        </div>

        {/* DynamicIcon Demo */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Dynamic Icons</CardTitle>
            <CardDescription>
              SVG-first icon system with Lucide React fallback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <DynamicIcon name="search-alt-2-svgrepo-com" width={24} height={24} />
                <span className="text-sm">SVG from /public/icons/</span>
              </div>
              <div className="flex items-center gap-2">
                <DynamicIcon name="heart" width={24} height={24} />
                <span className="text-sm">Lucide React fallback</span>
              </div>
              <div className="flex items-center gap-2">
                <DynamicIcon name="nonexistent-icon" width={24} height={24} />
                <span className="text-sm">Missing icon placeholder</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Demo */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>
              Primary, secondary, tertiary, and outline button variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="tertiary">Tertiary Button</Button>
              <Button variant="outline">Outline Button</Button>
            </div>
            <div className="mt-6 space-y-4">
              <Button variant="primary" size="sm">Small Button</Button>
              <Button variant="primary" size="md">Medium Button</Button>
              <Button variant="primary" size="lg">Large Button</Button>
            </div>
            <div className="mt-6">
              <Button variant="primary" fullWidth>Full Width Button</Button>
            </div>
            <div className="mt-6">
              <Button variant="primary" loading>Loading Button</Button>
            </div>
          </CardContent>
        </Card>

        {/* Input Demo */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Input Fields</CardTitle>
            <CardDescription>
              Form inputs with proper focus states and validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Input 
                label="Full Name" 
                placeholder="Enter your full name"
                helperText="This will be displayed on your profile"
              />
              <Input 
                label="Email Address" 
                type="email"
                placeholder="Enter your email"
              />
              <Input 
                label="Phone Number" 
                placeholder="Enter your phone number"
                error="Please enter a valid phone number"
              />
              <Input 
                label="Disabled Field" 
                placeholder="This field is disabled"
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Checkbox Demo */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Checkboxes</CardTitle>
            <CardDescription>
              Custom checkboxes with 4px radius and secondary blue accent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Checkbox 
                label="I agree to the terms and conditions"
                description="By checking this box, you agree to our terms of service and privacy policy"
              />
              <Checkbox 
                label="Subscribe to newsletter"
                description="Receive updates about new cars and special offers"
                defaultChecked
              />
              <Checkbox 
                label="Enable notifications"
                error="This field is required"
              />
            </div>
          </CardContent>
        </Card>

        {/* Radio Demo */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Radio Buttons</CardTitle>
            <CardDescription>
              Radio buttons with secondary blue dot indicator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup name="contact-method" defaultValue="email">
              <Radio 
                value="email"
                label="Email"
                description="We'll contact you via email"
              />
              <Radio 
                value="phone"
                label="Phone"
                description="We'll call you directly"
              />
              <Radio 
                value="whatsapp"
                label="WhatsApp"
                description="We'll message you on WhatsApp"
              />
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Card Variants Demo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="default" padding="lg">
            <CardTitle>Default Card</CardTitle>
            <CardDescription>
              Standard card with border and subtle shadow
            </CardDescription>
          </Card>
          
          <Card variant="elevated" padding="lg">
            <CardTitle>Elevated Card</CardTitle>
            <CardDescription>
              Professional floating look with enhanced shadow
            </CardDescription>
          </Card>
          
          <Card variant="outlined" padding="lg">
            <CardTitle>Outlined Card</CardTitle>
            <CardDescription>
              Simple card with border only, no shadow
            </CardDescription>
          </Card>
        </div>

        {/* Hover Card Demo */}
        <Card variant="elevated" padding="lg" hover>
          <CardHeader>
            <CardTitle>Hover Card</CardTitle>
            <CardDescription>
              This card has hover effects - try hovering over it!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[15px] leading-[26px] text-gray-600">
              Cards with the hover prop will lift slightly and enhance their shadow on hover,
              providing visual feedback for interactive elements.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}