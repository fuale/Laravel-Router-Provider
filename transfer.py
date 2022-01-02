#!/usr/bin/env python3
from pathlib import Path
import subprocess
import argparse
import logging
import sys


def main(args):
    phpProcess: subprocess.CompletedProcess = subprocess.run(
        ["php", Path("source/PackRouter.php").resolve()],
        stdout=subprocess.PIPE,
        env={"APP_BASE_PATH": args.source.expanduser().resolve()},
        encoding="utf-8",
    )

    if phpProcess.returncode != 0:
        logging.exception("laravel router exporting failed")
        sys.exit(1)

    if phpProcess.stdout == "":
        logging.exception("empty output; routes not defined?")
        sys.exit(1)

    nodeProcess = subprocess.run(
        [
            Path("node_modules/.bin/ts-node").resolve(),
            Path("source/PackRoutes.ts").resolve(),
        ],
        env={"MIDDLEWARE_TO_SKIP": args.middlewares_to_skip},
        input=phpProcess.stdout,
        stdout=subprocess.PIPE,
        encoding="utf-8",
    )

    if nodeProcess.returncode != 0:
        logging.exception("typescript router exporting failed")
        sys.exit(1)

    if nodeProcess.stdout == "":
        logging.exception("empty output; unreachable")
        sys.exit(1)

    args.destination.write(nodeProcess.stdout)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        usage="./transfer.py --from=Path/To/Project --to=routes.ts --middlewares-to-skip=web"
    )

    parser.add_argument(
        "-s",
        "--source",
        metavar="src_dir",
        help="source directory, where laravel app is",
        required=True,
        type=Path,
    )

    parser.add_argument(
        "-d",
        "--destination",
        metavar="dst_file",
        help="destination file name",
        required=True,
        type=argparse.FileType("w+", encoding="utf-8"),
    )

    parser.add_argument(
        "-m",
        "--middlewares-to-skip",
        metavar="middlewares,to,skip",
        help="middleware list to skip processing",
        required=False,
        default="web",
        type=str,
    )

    args = parser.parse_args()

    try:
        main(args)
    except KeyboardInterrupt:
        print("Interrupted")

    sys.exit(0)
