{ config, pkgs, lib, ... }:

with lib;

let
  format = pkgs.formats.yaml {};
  cfg = config.services.prusa-mqtt;
in
{
  options = {
    services.prusa-mqtt = {
      enable = mkEnableOption "prusa-mqtt";

      settings = mkOption {
        description = "Configuration for prusa-mqtt";
        type = format.type;
      };
    };
  };

  config = mkIf (cfg.enable) {
    systemd.services.prusa-mqtt = {
      path = with pkgs; [ prusa-mqtt ];
      script = "prusa-mqtt ${format.generate "config.yaml" cfg.settings}";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];
      serviceConfig.Restart = "always";
    };
  };
}
