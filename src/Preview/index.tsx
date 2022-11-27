import styles from "./styles.module.css";
import type { Readable } from "stream";

type PreviewProps = {
  stderr: Readable;
  stdout: Readable;
  cmd: string;
};

const Preview = ({ stderr, stdout, cmd }: PreviewProps) => {
  const [output, setOutput] = React.useState(() => `$ ${cmd}\n`);
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => {
    stderr.on("data", (data) => setOutput((prev) => prev + data));
    stdout.on("data", (data) => setOutput((prev) => prev + data));
    stdout.on("end", () => setFinished(true));
    stderr.on("end", () => setFinished(true));
  }, []);

  const end = finished ? "" : "\n";
  return (
    <div className={styles.preview}>
      <pre className={styles.output}>
        {output.trim()}
        {end}
      </pre>
    </div>
  );
};

export default Preview;
