import os
import shutil
import sys
import subprocess

# Prepares the all the lambdas for deployment
#
# Walks each directory looking for a build script and executes it if found

build_file_name = "build.py"

dir_path = os.path.dirname(os.path.realpath(__file__))
build_file_name = os.path.basename(__file__)
exit_code = 0

for file in os.listdir(dir_path):
    file = os.path.join(dir_path, file)
    if os.path.isdir(file):
        folder_path = os.path.join(dir_path, file)
        build_file_path = os.path.join(folder_path, build_file_name)
        if os.path.exists(build_file_path):
            cmd = [sys.executable, build_file_path]
            proc = subprocess.run(cmd, stderr=subprocess.STDOUT, shell=False)
            exit_code = exit_code + proc.returncode


exit(exit_code)
