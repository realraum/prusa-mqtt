{ config, pkgs, lib, ... }:

with lib;

{
  options = {
    services.prusa-mqtt.enable = mkEnableOption "prusa-mqtt";
  };

  config = mkIf (cfg.enable) {
    systemd.services.prusa-mqtt = {
      path = with pkgs; [ prusa-mqtt ];
      script = "prusa-mqtt";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];
      restart = "always";
    };
  };
}
