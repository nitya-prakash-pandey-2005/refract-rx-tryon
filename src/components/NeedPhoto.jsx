import { ScanFace } from "lucide-react";
import { Card } from "../ui";
import DemoPicker from "./DemoPicker";

export default function NeedPhoto({ title = "Start with a quick face scan", to }) {
  return (
    <div className="grid g-12">
      <Card className="span-7 pad-lg">
        <div className="empty">
          <ScanFace size={36} />
          <h3>{title}</h3>
          <p className="small muted">Refract measures your face with your camera (or a photo), then YouCam analyses your eye area. It takes about 30 seconds.</p>
          <a className="btn primary" href="#/scan">Scan my face</a>
        </div>
      </Card>
      <Card className="span-5" title="Or explore a sample profile">
        <DemoPicker compact to={to} />
        <p className="tiny muted" style={{ marginTop: 10 }}>Sample profiles replay real recorded YouCam responses and are labelled as sample data.</p>
      </Card>
    </div>
  );
}
