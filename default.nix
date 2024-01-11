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

  nativeBuildInputs = [
    makeWrapper
  ];

  postInstall = ''
    rm -rf $out
    cp -r $PWD $out
    ls $out
    makeWrapper ${nodejs.pkgs.pnpm} $out/bin/prusa-mqtt \
      --cwd $out \
      --arg "start"
  '';
}
