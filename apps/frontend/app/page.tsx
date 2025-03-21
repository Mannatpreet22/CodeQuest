import Image, { type ImageProps } from "next/image";
import styles from "./page.module.css";

type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <div></div>
  );
};

export default function Page() {
  return (
    <main className="flex flex-col items-center justify-center">
      Hi there!
    </main>
  );
}
