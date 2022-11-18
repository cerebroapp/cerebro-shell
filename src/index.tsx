import { exec } from "node:child_process";
import os from "node:os";
import termIcon from "./term.png";

import Preview from "./Preview";
import Hint from "./Preview/Hint";

import memoize from "memoizee";
import { shellHistory } from "shell-history";

// Plugin constants
const id = "shell";
const icon =
  process.platform === "darwin"
    ? "/Applications/Utilities/Terminal.app"
    : termIcon;

const MEMOIZE_OPTIONS = {
  length: false as false,
  promise: "then" as "then",
  maxAge: 5 * 60 * 1000,
  preFetch: true as true,
};

const getHistory = () => [...new Set(shellHistory().reverse() as string[])];

const getCachedHistory = memoize(getHistory, MEMOIZE_OPTIONS);

const getCachedEnv = memoize(async () => {
  const env = await import("shell-env").then(({ shellEnv }) => shellEnv());
  const ENV = {
    env: env,
    cwd: env.HOME || os.homedir(),
    shell: env.SHELL,
  };
  return ENV;
}, MEMOIZE_OPTIONS);

export const fn = ({ term, display, update, actions }) => {
  const match = term.match(/^\$\s*(.*)/);
  if (match) {
    const cmd = match[1];
    const title = `Shell command: ${cmd}`;

    const onSelect = async (event) => {
      event.preventDefault();
      actions.replaceTerm(term);

      // Get user env, execute command and update preview
      const { env, cwd, shell } = await getCachedEnv();

      const { stdout, stderr } = exec(cmd, { shell, env, cwd });

      const getPreview = () => (
        <Preview cmd={cmd} stdout={stdout!} stderr={stderr!} />
      );
      update(id, { getPreview });
    };

    display({
      id,
      title,
      icon,
      onSelect,
      getPreview: () => <Hint />,
    });

    const history = getCachedHistory();
    // Load shell history and suggest autocomplete after loading
    let autocomplete = history?.find(
      (item) => item !== cmd && item.startsWith(cmd)
    );
    autocomplete = autocomplete ? `$ ${autocomplete}` : term;
    update(id, { term: autocomplete });
  }
};

export const keyword = "$";
export const name = "Shell command";
