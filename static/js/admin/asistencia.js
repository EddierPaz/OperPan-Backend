document.addEventListener(
    "DOMContentLoaded",
    function () {

        const empleadoSelect =
            document.getElementById(
                "empleadoSelect"
            );

        const cargoInput =
            document.getElementById(
                "cargoInput"
            );

        const turnoSelect =
            document.getElementById(
                "turnoSelect"
            );

        const horaEntrada =
            document.getElementById(
                "horaEntrada"
            );

        const horaSalida =
            document.getElementById(
                "horaSalida"
            );

        empleadoSelect.addEventListener(
            "change",
            function () {

                const cargo =
                    this.options[
                        this.selectedIndex
                    ].dataset.cargo;

                cargoInput.value =
                    cargo || "";

            }
        );

        turnoSelect.addEventListener(
            "change",
            function () {

                switch (this.value) {

                    case "MANANA":

                        horaEntrada.value =
                            "05:00";

                        horaSalida.value =
                            "13:00";

                        break;

                    case "TARDE":

                        horaEntrada.value =
                            "13:00";

                        horaSalida.value =
                            "22:00";

                        break;

                    case "FIJO":

                        horaEntrada.value =
                            "08:00";

                        horaSalida.value =
                            "17:00";

                        break;

                }

            }
        );

    }
);