{ lib
, mkPnpmPackage
, fetchFromGitHub
, makeWrapper
, nodejs
}:

mkPnpmPackage rec {
  name = "prusa-mqtt";

  src = ./.;

  distDir = ".gitignore";

  dontBuild = true;

  postInstall = ''
    patchShebangs bin.js
    rm -rf $out
    cp -r $PWD $out
    ls $out
    mkdir -p $out/bin
    ln -s $out/bin.js $out/bin/prusa-mqtt
  '';
}
