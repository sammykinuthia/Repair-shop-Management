import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RepairService } from '../../features/repairs/repair.service';
import { SettingsService } from '../../features/settings/settings.service'; // Import settings
import { QRCodeSVG } from 'qrcode.react';
import { Scissors } from 'lucide-react';

export default function TicketPrint() {
  const { id } = useParams();
  const [repair, setRepair] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      // Fetch both Repair and Shop Settings
      const [repairData, shopData] = await Promise.all([
        RepairService.getById(Number(id)),
        SettingsService.getSettings()
      ]);
      
      setRepair(repairData);
      setShop(shopData);

      setTimeout(() => {
        window.print();
      }, 1000);
    }
    load();
  }, [id]);

  if (!repair || !shop) return <div className="p-4">Loading Ticket...</div>;

  const balance = repair.final_price - repair.amount_paid;

  return (
    <div className="p-4 max-w-[300px] mx-auto font-mono text-sm bg-white text-black leading-snug">
      {/* SHOP HEADER */}
      <div className="text-center border-b-2 border-black pb-2 mb-2">
        <h1 className="text-xl font-bold uppercase">{shop.shop_name}</h1>
        <p className="text-xs">{shop.shop_address}</p>
        <p className="text-xs">Tel: {shop.shop_phone}</p>
      </div>

      <div className="mb-2 text-center">
        <p className="font-bold text-lg border border-black p-1 inline-block">
          TICKET: {repair.ticket_no}
        </p>
        <p className="text-xs mt-1">{new Date(repair.created_at).toLocaleString()}</p>
      </div>

      {/* INFO GRID */}
      <div className="mb-2 border-b border-dashed border-black pb-2">
        <div className="flex justify-between">
            <span className="font-bold">CLIENT:</span>
            <span>{repair.client_name}</span>
        </div>
        <div className="flex justify-between">
            <span className="font-bold">PHONE:</span>
            <span>{repair.client_phone}</span>
        </div>
      </div>

      <div className="mb-2 border-b border-dashed border-black pb-2">
        <p className="font-bold">DEVICE:</p>
        <p>{repair.device_type} - {repair.brand} {repair.model}</p>
        <p className="text-xs">S/N: {repair.serial_no}</p>
        <p className="mt-1 font-bold">REPORTED FAULT:</p>
        <p className="text-xs">{repair.issue_description}</p>
      </div>

    {/* TECH NOTES (Only if available) */}
    {repair.diagnosis && (
        <div className="mb-2 border-b border-dashed border-black pb-2">
            <p className="font-bold">TECHNICIAN REPORT:</p>
            <p className="text-xs">{repair.diagnosis}</p>
        </div>
    )}
    {/* Always show STATUS */}
    <div className="mb-2 border-b border-dashed border-black pb-2">
        <p className="text-xs mt-1 font-bold">STATUS: {repair.status}</p>
    </div>

    {/* FINANCIALS */}
      <div className="mb-4">
        <div className="flex justify-between">
            <span>Parts & Labor:</span>
            <span>{repair.final_price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>{repair.amount_paid.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-black mt-1 pt-1">
            <span>BALANCE:</span>
            <span>{balance > 0 ? balance.toLocaleString() : '0.00'}</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mb-4">
        <QRCodeSVG value={repair.ticket_no} size={80} />
      </div>

      <div className="text-[10px] text-justify leading-tight border-t border-black pt-2">
        <p className="font-bold mb-1">TERMS:</p>
        {shop.terms}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs border-t border-dashed border-black pt-4">
        <Scissors size={12} /> Cut Here
      </div>
    </div>
  );
}