#!/usr/bin/env python3
from pathlib import Path
import subprocess
import logging
import sys


def main(project):
    phpProcess: subprocess.CompletedProcess = subprocess.run(
        ["php", Path("source/PackRouter.php").resolve(), project],
        stdout=subprocess.PIPE,
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

    sys.stdout.write(nodeProcess.stdout)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        logging.exception(
            "Not enough arguments. Expected 1 (path to laravel project), got 0"
        )

        sys.exit(1)

    try:
        main(sys.argv[1])
    except KeyboardInterrupt:
        print("Interrupted")

    sys.exit(0)
