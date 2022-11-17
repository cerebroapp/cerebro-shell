import styles from "./styles.module.css";
import type { Readable } from "stream";

type PreviewProps = {
  stderr: Readable;
  stdout: Readable;
  cmd: string;
};

const Preview = ({ stderr, stdout, cmd }: PreviewProps) => {
  console.log({ a: stderr.on }, stdout, cmd);
  const [output, setOutput] = React.useState(() => `$ ${cmd}\n`);
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => {
    console.log("suscribed");
    stderr.setEncoding("utf-8").on("data", (data) => {
      console.log("data");
      setOutput((prev) => prev + data);
    });
    stdout
      .setEncoding("utf-8")
      .on("data", (data) => setOutput((prev) => prev + data));
    stdout.on("end", () => setFinished(true));
    stderr.on("end", () => setFinished(true));
  }, []);

  console.log(output);
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
