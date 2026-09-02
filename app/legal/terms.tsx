import { LegalDoc } from '@/components/ui/LegalDoc';
import { TERMS_DOC } from '@/lib/data/legal';

export default function TermsScreen() {
  return <LegalDoc doc={TERMS_DOC} fallback="/settings" />;
}
