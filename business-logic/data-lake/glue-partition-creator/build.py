import os
import subprocess
import sys
import shutil

def exit_on_failure(exit_code, msg):
    if exit_code != 0:
        print(msg)
        exit(exit_code)

dir_path = os.path.dirname(os.path.realpath(__file__))
npm_cmd = shutil.which("npm")

if not npm_cmd:
    exit_on_failure(1, "npm not found. Make sure it's installed and available in PATH.")

cmd = [npm_cmd, "install"]
proc = subprocess.run(cmd, stderr=subprocess.STDOUT, shell=False, cwd=dir_path)
exit_on_failure(proc.returncode, "Web app npm install failed")
