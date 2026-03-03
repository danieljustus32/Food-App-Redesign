import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="bg-background pt-20 pb-24 px-4" data-testid="page-privacy-policy">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-1 text-primary font-medium mb-6 hover:opacity-80 transition-opacity"
          data-testid="button-back-profile"
        >
          <ChevronLeft size={20} />
          Profile
        </button>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 3, 2026</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pixel Perfect Design & Development, LLC ("we," "our," or "us") operates the Tindish application ("App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App. Please read this policy carefully. By using Tindish, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We collect information that you provide directly to us when you use the App:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Account Information:</strong> Your email address and password (hashed) when you create an account, or authentication details if you sign in through Google or Apple.</li>
              <li><strong className="text-foreground">Dietary Preferences:</strong> Any dietary preferences you set (e.g., vegetarian, vegan, gluten-free, keto) to personalize your recipe recommendations.</li>
              <li><strong className="text-foreground">Allergen Information:</strong> Any food allergies you indicate (e.g., milk, eggs, peanuts, shellfish) so we can filter recipes accordingly.</li>
              <li><strong className="text-foreground">Saved Recipes:</strong> Recipes you save to your Cookbook, including recipe titles, ingredients, instructions, and images.</li>
              <li><strong className="text-foreground">Shopping Lists:</strong> Items you add to your shopping list, including item names and categories.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Information about how you interact with the App, such as recipes you swipe on and features you use.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Create and manage your account</li>
              <li>Personalize recipe recommendations based on your dietary preferences and allergens</li>
              <li>Filter out recipes that contain ingredients you are allergic to</li>
              <li>Save your recipes and maintain your Cookbook</li>
              <li>Manage your shopping lists</li>
              <li>Provide the hands-free cooking mode experience</li>
              <li>Improve and optimize the App</li>
              <li>Communicate with you about updates or changes to the App</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Tindish retrieves recipe data from third-party recipe API providers, which may include Spoonacular, FatSecret, and Edamam. When we fetch recipes on your behalf:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>We send your dietary preferences and allergen filters to these services to return relevant recipes</li>
              <li>We do not share your personal account information (email, name) with these providers</li>
              <li>These providers have their own privacy policies, which we encourage you to review</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              If you sign in using Google or Apple, those services may share limited profile information with us (such as your email address) in accordance with their own privacy policies and your authorization.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Cookies and Sessions</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use session-based authentication to keep you logged in. A session cookie is stored in your browser to maintain your authenticated state. This cookie is essential for the App to function and is not used for tracking or advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you with the App's services. If you delete your account, we will delete or anonymize your personal information within a reasonable timeframe, unless we are required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information. Passwords are stored in hashed form and are never stored in plain text. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tindish is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong className="text-foreground">Correction:</strong> Request that we correct any inaccurate information.</li>
              <li><strong className="text-foreground">Deletion:</strong> Request that we delete your personal information.</li>
              <li><strong className="text-foreground">Portability:</strong> Request a portable copy of your data.</li>
              <li><strong className="text-foreground">Objection:</strong> Object to certain processing of your data.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              To exercise any of these rights, please contact us using the information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the App and updating the "Last updated" date at the top of this page. Your continued use of the App after any changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong className="text-foreground">Pixel Perfect Design & Development, LLC</strong><br />
              Email: privacy@tindish.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
