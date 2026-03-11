import {getAllPromotions} from '@/lib/db/repositories/services.repository';
import {getDefaultCurrency} from '@/lib/db/repositories/analytics.repository';
import {PromotionsEditor} from '@/components/console/cms/promotions-editor';

export default async function PromotionsPage() {
    const [promotions, currency] = await Promise.all([getAllPromotions(), getDefaultCurrency()]);
    return <PromotionsEditor initialData={promotions} defaultCurrency={currency}/>;
}
