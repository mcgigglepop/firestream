import os
import subprocess
import sys
import shutil


def exit_on_failure(exit_code, msg):
    if exit_code != 0:
        print(msg)
        exit(exit_code)


npm_cmd = shutil.which("npm")
npx_cmd = shutil.which("npx")

cmd = [npm_cmd, "install"]
proc = subprocess.run(cmd, stderr=subprocess.STDOUT, shell=False)
exit_on_failure(proc.returncode, "Cdk npm install failed")

cmd = [npx_cmd, "cdk", "synth"]
proc = subprocess.run(cmd, stderr=subprocess.STDOUT, shell=False)
exit_on_failure(proc.returncode, "Cdk synth failed")