import { LegalDoc } from '@/components/ui/LegalDoc';
import { PRIVACY_DOC } from '@/lib/data/legal';

export default function PrivacyPolicyScreen() {
  return <LegalDoc doc={PRIVACY_DOC} fallback="/settings" />;
}
