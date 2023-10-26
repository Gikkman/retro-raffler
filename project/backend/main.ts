import { Backend } from "@/backend";
import type {TYPE} from "@t/File";

const a: TYPE = {a: 1};
console.log(a);

const backend = new Backend();
backend.start();
