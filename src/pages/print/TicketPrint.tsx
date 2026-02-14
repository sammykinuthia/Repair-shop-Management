import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RepairService } from '../../features/repairs/repair.service';
import { SettingsService } from '../../features/settings/settings.service'; // This now uses OrgService internally based on previous steps
import { OrganizationService } from '../../features/organization/org.service';
import { ImageManager } from '../../lib/storage';
import { QRCodeSVG } from 'qrcode.react';
import { Scissors } from 'lucide-react';

// --- SUB-COMPONENT: Single Receipt Layout ---
const SingleReceipt = ({ repair, shop, logoUrl, title }: { repair: any, shop: any, logoUrl: string | null, title: string }) => {
  const balance = repair.final_price - repair.amount_paid;

  return (
    <div className="bg-white text-black font-mono text-sm pb-8 mb-8 border-b-2 border-dashed border-black last:border-0">
      
      {/* HEADER WITH LOGO */}
      <div className="text-center border-b-2 border-black pb-2 mb-2 flex flex-col items-center">
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-16 mb-2 object-contain grayscale" />
        )}
        <h1 className="text-xl font-bold uppercase">{shop.name}</h1>
        <p className="text-xs">{shop.address}</p>
        <p className="text-xs">Tel: {shop.phone}</p>
        <p className="font-bold text-xs mt-2 border border-black px-2 py-1 rounded">{title}</p>
      </div>

      <div className="mb-2 text-center">
        <p className="font-bold text-lg border border-black p-1 inline-block">
          TICKET: {repair.ticket_no}
        </p>
        <p className="text-xs mt-1">{new Date(repair.created_at).toLocaleString()}</p>
      </div>

      {/* INFO GRID */}
      <div className="mb-2 border-b border-dashed border-black pb-2">
        <div className="flex justify-between"><span className="font-bold">CLIENT:</span><span>{repair.client_name}</span></div>
        <div className="flex justify-between"><span className="font-bold">PHONE:</span><span>{repair.client_phone}</span></div>
      </div>

      <div className="mb-2 border-b border-dashed border-black pb-2">
        <p className="font-bold">DEVICE:</p>
        <p>{repair.device_type} - {repair.brand} {repair.model}</p>
        <p className="text-xs">S/N: {repair.serial_no}</p>
        <p className="mt-1 font-bold">REPORTED FAULT:</p>
        <p className="text-xs">{repair.issue_description}</p>
        <p className="mt-1 font-bold">ACCESSORIES:</p>
        <p className="text-xs">{repair.accessories || 'None'}</p>
      </div>

      {/* TECH NOTES (Only if available) */}
      {repair.diagnosis && (
          <div className="mb-2 border-b border-dashed border-black pb-2">
            <p className="font-bold">TECHNICIAN REPORT:</p>
            <p className="text-xs">{repair.diagnosis}</p>
            <p className="text-xs mt-1 font-bold">STATUS: {repair.status}</p>
          </div>
      )}

      {/* FINANCIALS */}
      <div className="mb-4">
        <div className="flex justify-between"><span>Parts & Labor:</span><span>{repair.final_price.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Amount Paid:</span><span>{repair.amount_paid.toLocaleString()}</span></div>
        <div className="flex justify-between font-bold border-t border-black mt-1 pt-1 text-lg">
            <span>BALANCE:</span>
            <span>{balance > 0 ? balance.toLocaleString() : '0.00'}</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mb-4">
        <QRCodeSVG value={repair.ticket_no} size={80} />
      </div>

      {/* RICH TEXT TERMS */}
      <div className="text-[10px] text-justify leading-tight border-t border-black pt-2">
        <p className="font-bold mb-1">TERMS & CONDITIONS:</p>
        {/* Render HTML for bold/newlines. Safe because it's local admin input */}
        <div 
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: shop.terms }} 
        />
      </div>

      <div className="mt-2 text-center text-[10px] italic">
        Printed by Royoltech Repair Manager
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function TicketPrint() {
  const { id } = useParams();
  const [repair, setRepair] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [repairData, shopData] = await Promise.all([
        RepairService.getById(id),
        OrganizationService.getCurrent()
      ]);
      
      setRepair(repairData);
      setShop(shopData);

      // Load Logo
      if (shopData && shopData.logo_url) {
        const url = await ImageManager.getUrl(shopData.logo_url);
        setLogoUrl(url);
      }

      setTimeout(() => {
        window.print();
      }, 1000);
    }
    load();
  }, [id]);

  if (!repair || !shop) return <div className="p-4">Loading Ticket...</div>;

  return (
    <div className="p-2 max-w-[320px] mx-auto bg-white">
      {/* COPY 1: CUSTOMER */}
      <SingleReceipt repair={repair} shop={shop} logoUrl={logoUrl} title="CUSTOMER COPY" />
      
      <div className="flex items-center justify-center gap-2 text-xs py-4">
        <Scissors size={14} /> ------------------ CUT HERE ------------------
      </div>

      {/* COPY 2: SHOP RECORD */}
      <SingleReceipt repair={repair} shop={shop} logoUrl={logoUrl} title="SHOP RECORD" />
    </div>
  );
}