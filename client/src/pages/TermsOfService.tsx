import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const [, navigate] = useLocation();

  return (
    <div className="bg-background pt-20 pb-24 px-4" data-testid="page-terms-of-service">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-1 text-primary font-medium mb-6 hover:opacity-80 transition-opacity"
          data-testid="button-back-profile"
        >
          <ChevronLeft size={20} />
          Profile
        </button>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 3, 2026</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Tindish application ("App"), operated by Pixel Perfect Design & Development, LLC ("we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Tindish is a recipe discovery application that provides the following features:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Discover:</strong> Browse and swipe through recipe cards to find meals that interest you.</li>
              <li><strong className="text-foreground">Cookbook:</strong> Save your favorite recipes to a personal collection for easy access.</li>
              <li><strong className="text-foreground">Shopping List:</strong> Generate shopping lists from recipe ingredients, organized by grocery aisle.</li>
              <li><strong className="text-foreground">Cooking Mode:</strong> Follow step-by-step cooking instructions with hands-free voice commands.</li>
              <li><strong className="text-foreground">Personalization:</strong> Set dietary preferences and allergen filters to customize your recipe recommendations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use Tindish, you must create an account by providing a valid email address and password, or by signing in through Google or Apple. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              You agree not to use the App to:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Violate any applicable law or regulation</li>
              <li>Interfere with or disrupt the App or its servers</li>
              <li>Attempt to gain unauthorized access to any part of the App</li>
              <li>Use automated systems or software to extract data from the App (scraping)</li>
              <li>Transmit any malicious code, viruses, or harmful content</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Recipe Content Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Recipe content displayed in Tindish is sourced from third-party recipe API providers. We do not create, verify, or guarantee the accuracy, completeness, or safety of any recipe, including its ingredients, nutritional information, or preparation instructions.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong className="text-foreground">Allergen Warning:</strong> While Tindish offers allergen filtering based on ingredient keyword matching, this filtering is not guaranteed to catch every allergen or ingredient variant. You must always independently verify recipe ingredients to ensure they are safe for your dietary needs and allergies. We are not responsible for any adverse reactions resulting from reliance on the App's allergen filtering.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Tindish name, logo, design, and original content are the property of Pixel Perfect Design & Development, LLC. Recipe content is provided by and remains the property of their respective sources. You may not copy, modify, distribute, or create derivative works from the App's proprietary content without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              The App is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. We do not warrant that the App will be uninterrupted, error-free, or free of harmful components. We make no guarantees regarding the accuracy or reliability of any recipe content, nutritional information, or allergen data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, Pixel Perfect Design & Development, LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the App. This includes, but is not limited to, damages arising from allergic reactions, food-related illness, reliance on recipe content, or any interruption of service. Our total liability to you for any claims shall not exceed the amount you have paid to us, if any, for use of the App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless Pixel Perfect Design & Development, LLC, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising out of your use of the App or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account and access to the App at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. You may also delete your account at any time. Upon termination, your right to use the App will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the state in which Pixel Perfect Design & Development, LLC is organized, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">12. Changes to These Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may revise these Terms at any time by updating this page. We will notify you of material changes by posting a notice within the App and updating the "Last updated" date. Your continued use of the App after any changes constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong className="text-foreground">Pixel Perfect Design & Development, LLC</strong><br />
              Email: legal@tindish.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
