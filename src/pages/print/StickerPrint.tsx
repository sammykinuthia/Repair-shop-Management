import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RepairService } from '../../features/repairs/repair.service';
import { OrganizationService } from '../../features/organization/org.service';
import { QRCodeSVG } from 'qrcode.react';

export default function StickerPrint() {
  const { id } = useParams();
  const [repair, setRepair] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [r, s] = await Promise.all([
        RepairService.getById(id),
        OrganizationService.getCurrent()
      ]);
      setRepair(r);
      setShop(s);
      setTimeout(() => window.print(), 800);
    }
    load();
  }, [id]);

  if (!repair) return <div>Loading...</div>;

  return (
    <div className="w-[300px] h-[180px] border-2 border-black p-2 bg-white flex flex-row gap-2 overflow-hidden box-border">
      {/* LEFT: QR & BIG ID */}
      <div className="flex flex-col items-center justify-center w-1/3 border-r border-black pr-2">
        <h1 className="text-2xl font-black">{repair.ticket_no}</h1>
        <QRCodeSVG value={repair.ticket_no} size={60} />
        <p className="text-[10px] mt-1 font-bold">{new Date(repair.created_at).toLocaleDateString()}</p>
      </div>

      {/* RIGHT: DETAILS */}
      <div className="flex-1 flex flex-col justify-between text-xs font-mono leading-tight">
        <div>
          <p className="font-bold uppercase truncate">{shop?.name || 'REPAIR SHOP'}</p>
          <div className="h-px bg-black my-1"></div>
          <p className="font-bold">CLIENT: {repair.client_name}</p>
          <p>{repair.client_phone}</p>
        </div>
        
        <div className="mt-1">
          <p className="font-bold">DEVICE:</p>
          <p className="truncate">{repair.device_type}</p>
          <p className="truncate">{repair.brand} {repair.model}</p>
        </div>

        <div className="mt-auto pt-1 text-[10px] text-center bg-black text-white font-bold">
          DO NOT REMOVE
        </div>
      </div>
    </div>
  );
}