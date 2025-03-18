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
    <main>
      <ThemeImage srcLight="/light.png" srcDark="/dark.png" alt="Theme image" />
      hi there!
    </main>
  );
}
