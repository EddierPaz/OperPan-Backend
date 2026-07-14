-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 14-07-2026 a las 05:34:11
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `operpan`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `delete_memorando` (IN `proc_mem_id` INT)   BEGIN   
        DELETE FROM memorando
        WHERE mem_id =proc_mem_id;    
    END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `insert_memorando` (IN `proc_mem_id` INT, IN `proc_emp_id` INT, IN `proc_mem_fecha` DATE, IN `proc_mem_tipo` VARCHAR(100), IN `proc_mem_descrip` VARCHAR(255))   BEGIN
                INSERT INTO memorando(
                    mem_id, 
                    emp_id, 
                    mem_fecha, 
                    mem_tipo, 
                    mem_descrip
                ) VALUES (
                    proc_mem_id,
                    proc_emp_id,
                    proc_mem_fecha,
                    proc_mem_tipo,
                    proc_mem_descrip
                );
            END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `proc_emp_mem` ()   BEGIN
        SELECT
            CONCAT(e.emp_nom, ' ' ,e.emp_ape) AS nombreCompleto,
            m.mem_id, m.mem_descrip FROM empleado e
        INNER JOIN memorando m ON e.emp_id = m.emp_id;
    END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `proc_emp_per` ()   BEGIN
                SELECT 
                    CONCAT(e.emp_nom, ' ', e.emp_ape) AS nombreCompleto,
                    p.per_fecha, p.per_descrip, p.per_estado	
                FROM permiso p
                INNER JOIN empleado e ON p.emp_id = e.emp_id;
            END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `UPDATE_HORARIO` (IN `proc_hor_id` INT, IN `proc_hor_carg_id` INT, IN `proc_hor_jrn` VARCHAR(255))   BEGIN
        UPDATE horario
        SET hor_jrn = proc_hor_jrn
        WHERE hor_id = proc_hor_id;

        UPDATE empleado
        SET hor_id = proc_hor_id
        WHERE hor_id = proc_hor_id;

        SELECT CONCAT('Se actualizó el horario ID ', proc_hor_id, 
                    ' con la descripción "', proc_hor_jrn, 
                    '" y se aplicó a los empleados correspondientes.') AS mensaje;
    END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencia_asistencia`
--

CREATE TABLE `asistencia_asistencia` (
  `id` bigint(20) NOT NULL,
  `fecha` date NOT NULL,
  `estado` varchar(10) DEFAULT NULL,
  `hora_marcada` time(6) DEFAULT NULL,
  `fecha_registro` datetime(6) NOT NULL,
  `horario_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencia_descansoempleado`
--

CREATE TABLE `asistencia_descansoempleado` (
  `id` bigint(20) NOT NULL,
  `fecha` date NOT NULL,
  `es_descanso` tinyint(1) NOT NULL,
  `horario_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencia_horario`
--

CREATE TABLE `asistencia_horario` (
  `id` bigint(20) NOT NULL,
  `turno` varchar(10) NOT NULL,
  `hora_entrada` time(6) NOT NULL,
  `hora_salida` time(6) NOT NULL,
  `estado` tinyint(1) NOT NULL,
  `fecha_creacion` datetime(6) NOT NULL,
  `empleado_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `auth_group`
--

CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `auth_group_permissions`
--

CREATE TABLE `auth_group_permissions` (
  `id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `auth_permission`
--

CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `auth_permission`
--

INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES
(1, 'Can add log entry', 1, 'add_logentry'),
(2, 'Can change log entry', 1, 'change_logentry'),
(3, 'Can delete log entry', 1, 'delete_logentry'),
(4, 'Can view log entry', 1, 'view_logentry'),
(5, 'Can add permission', 2, 'add_permission'),
(6, 'Can change permission', 2, 'change_permission'),
(7, 'Can delete permission', 2, 'delete_permission'),
(8, 'Can view permission', 2, 'view_permission'),
(9, 'Can add group', 3, 'add_group'),
(10, 'Can change group', 3, 'change_group'),
(11, 'Can delete group', 3, 'delete_group'),
(12, 'Can view group', 3, 'view_group'),
(13, 'Can add content type', 4, 'add_contenttype'),
(14, 'Can change content type', 4, 'change_contenttype'),
(15, 'Can delete content type', 4, 'delete_contenttype'),
(16, 'Can view content type', 4, 'view_contenttype'),
(17, 'Can add session', 5, 'add_session'),
(18, 'Can change session', 5, 'change_session'),
(19, 'Can delete session', 5, 'delete_session'),
(20, 'Can view session', 5, 'view_session'),
(21, 'Can add user', 6, 'add_user'),
(22, 'Can change user', 6, 'change_user'),
(23, 'Can delete user', 6, 'delete_user'),
(24, 'Can view user', 6, 'view_user'),
(25, 'Can add perfil empleado', 7, 'add_perfilempleado'),
(26, 'Can change perfil empleado', 7, 'change_perfilempleado'),
(27, 'Can delete perfil empleado', 7, 'delete_perfilempleado'),
(28, 'Can view perfil empleado', 7, 'view_perfilempleado'),
(29, 'Can add certificado', 8, 'add_certificado'),
(30, 'Can change certificado', 8, 'change_certificado'),
(31, 'Can delete certificado', 8, 'delete_certificado'),
(32, 'Can view certificado', 8, 'view_certificado'),
(33, 'Can add incapacidad', 9, 'add_incapacidad'),
(34, 'Can change incapacidad', 9, 'change_incapacidad'),
(35, 'Can delete incapacidad', 9, 'delete_incapacidad'),
(36, 'Can view incapacidad', 9, 'view_incapacidad'),
(37, 'Can add permiso', 10, 'add_permiso'),
(38, 'Can change permiso', 10, 'change_permiso'),
(39, 'Can delete permiso', 10, 'delete_permiso'),
(40, 'Can view permiso', 10, 'view_permiso'),
(41, 'Can add horario', 11, 'add_horario'),
(42, 'Can change horario', 11, 'change_horario'),
(43, 'Can delete horario', 11, 'delete_horario'),
(44, 'Can view horario', 11, 'view_horario'),
(45, 'Can add descanso empleado', 12, 'add_descansoempleado'),
(46, 'Can change descanso empleado', 12, 'change_descansoempleado'),
(47, 'Can delete descanso empleado', 12, 'delete_descansoempleado'),
(48, 'Can view descanso empleado', 12, 'view_descansoempleado'),
(49, 'Can add asistencia', 13, 'add_asistencia'),
(50, 'Can change asistencia', 13, 'change_asistencia'),
(51, 'Can delete asistencia', 13, 'delete_asistencia'),
(52, 'Can view asistencia', 13, 'view_asistencia'),
(53, 'Can add task', 14, 'add_task'),
(54, 'Can change task', 14, 'change_task'),
(55, 'Can delete task', 14, 'delete_task'),
(56, 'Can view task', 14, 'view_task');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cargo`
--

CREATE TABLE `cargo` (
  `carg_id` int(11) NOT NULL,
  `carg_tipo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cargo`
--

INSERT INTO `cargo` (`carg_id`, `carg_tipo`) VALUES
(1, 'Mesero'),
(2, 'Cajero'),
(3, 'Cocinero'),
(4, 'Panadero'),
(5, 'Pastelero');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `django_admin_log`
--

CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext DEFAULT NULL,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) UNSIGNED NOT NULL CHECK (`action_flag` >= 0),
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `django_content_type`
--

CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `django_content_type`
--

INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
(1, 'admin', 'logentry'),
(13, 'asistencia', 'asistencia'),
(12, 'asistencia', 'descansoempleado'),
(11, 'asistencia', 'horario'),
(3, 'auth', 'group'),
(2, 'auth', 'permission'),
(4, 'contenttypes', 'contenttype'),
(8, 'novedades', 'certificado'),
(9, 'novedades', 'incapacidad'),
(10, 'novedades', 'permiso'),
(5, 'sessions', 'session'),
(14, 'tareas', 'task'),
(7, 'usuarios', 'perfilempleado'),
(6, 'usuarios', 'user');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `django_migrations`
--

CREATE TABLE `django_migrations` (
  `id` bigint(20) NOT NULL,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `django_migrations`
--

INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
(1, 'contenttypes', '0001_initial', '2026-07-14 03:21:35.674370'),
(2, 'contenttypes', '0002_remove_content_type_name', '2026-07-14 03:21:35.886272'),
(3, 'auth', '0001_initial', '2026-07-14 03:21:36.383231'),
(4, 'auth', '0002_alter_permission_name_max_length', '2026-07-14 03:21:36.499087'),
(5, 'auth', '0003_alter_user_email_max_length', '2026-07-14 03:21:36.526055'),
(6, 'auth', '0004_alter_user_username_opts', '2026-07-14 03:21:36.545356'),
(7, 'auth', '0005_alter_user_last_login_null', '2026-07-14 03:21:36.568958'),
(8, 'auth', '0006_require_contenttypes_0002', '2026-07-14 03:21:36.576115'),
(9, 'auth', '0007_alter_validators_add_error_messages', '2026-07-14 03:21:36.595328'),
(10, 'auth', '0008_alter_user_username_max_length', '2026-07-14 03:21:36.615158'),
(11, 'auth', '0009_alter_user_last_name_max_length', '2026-07-14 03:21:36.648848'),
(12, 'auth', '0010_alter_group_name_max_length', '2026-07-14 03:21:36.677449'),
(13, 'auth', '0011_update_proxy_permissions', '2026-07-14 03:21:36.697065'),
(14, 'auth', '0012_alter_user_first_name_max_length', '2026-07-14 03:21:36.717249'),
(15, 'usuarios', '0001_initial', '2026-07-14 03:21:37.555676'),
(16, 'admin', '0001_initial', '2026-07-14 03:21:37.822441'),
(17, 'admin', '0002_logentry_remove_auto_add', '2026-07-14 03:21:37.853432'),
(18, 'admin', '0003_logentry_add_action_flag_choices', '2026-07-14 03:21:37.886087'),
(19, 'usuarios', '0002_perfilempleado_parentesco_emergencia', '2026-07-14 03:21:37.977956'),
(20, 'usuarios', '0003_alter_perfilempleado_id_alter_user_id', '2026-07-14 03:21:40.576968'),
(21, 'usuarios', '0004_alter_perfilempleado_id_alter_user_id', '2026-07-14 03:21:42.992674'),
(22, 'usuarios', '0005_alter_perfilempleado_id_alter_user_id', '2026-07-14 03:21:45.495477'),
(23, 'usuarios', '0006_alter_perfilempleado_id_alter_user_id', '2026-07-14 03:21:47.980970'),
(24, 'asistencia', '0001_initial', '2026-07-14 03:21:48.494100'),
(25, 'novedades', '0001_initial', '2026-07-14 03:21:49.147566'),
(26, 'novedades', '0002_certificado_decision_fecha_certificado_decision_por_and_more', '2026-07-14 03:21:49.667741'),
(27, 'sessions', '0001_initial', '2026-07-14 03:21:49.742655'),
(28, 'tareas', '0001_initial', '2026-07-14 03:21:50.156605'),
(29, 'tareas', '0002_alter_task_options_and_more', '2026-07-14 03:21:52.033887');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `django_session`
--

CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `django_session`
--

INSERT INTO `django_session` (`session_key`, `session_data`, `expire_date`) VALUES
('vk9rmyrep4811t2y9l43pbfd7odwjr23', '.eJxVjEsOwjAMBe-SNYri1nFcluw5Q5TUDimgVupnhbg7VOoCtm9m3svEtK01bovOcRBzNo05_W459Q8ddyD3NN4m20_jOg_Z7oo96GKvk-jzcrh_BzUt9Vuz9xQCC6uHnsEXVEaPKLkIdI5bAiKEgFl9aVynhNIIECC0jqk17w-zwTY7:1wjTsX:q0JoJJ0gaSk3TYufynCCOWUH3S8TjDKczYbMD5a-ggY', '2026-07-28 03:32:17.755164');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleado`
--

CREATE TABLE `empleado` (
  `emp_id` int(11) NOT NULL,
  `emp_nom` varchar(100) NOT NULL,
  `emp_ape` varchar(100) NOT NULL,
  `emp_doc` int(11) NOT NULL,
  `emp_tel` int(11) NOT NULL,
  `emp_dir` varchar(255) NOT NULL,
  `emp_correo` varchar(255) DEFAULT NULL,
  `contrato_ini` date NOT NULL,
  `contrato_fin` date DEFAULT NULL,
  `estado_id` int(11) NOT NULL,
  `hor_id` int(11) NOT NULL,
  `carg_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empleado`
--

INSERT INTO `empleado` (`emp_id`, `emp_nom`, `emp_ape`, `emp_doc`, `emp_tel`, `emp_dir`, `emp_correo`, `contrato_ini`, `contrato_fin`, `estado_id`, `hor_id`, `carg_id`) VALUES
(1, 'Juan Carlos', 'Perez Gomez', 1010, 300111111, 'Calle 10', 'juan@gmail.com', '2024-01-10', NULL, 1, 2, 1),
(2, 'Maria', 'Lopez', 1020, 300222222, 'Calle 20', 'maria@gmail.com', '2023-05-15', NULL, 1, 2, 1),
(3, 'Carlos', 'Gomez', 1030, 300333333, 'Calle 30', 'carlos@gmail.com', '2024-02-20', NULL, 1, 3, 2),
(4, 'Ana', 'Martinez', 1040, 300444444, 'Calle 40', 'ana@gmail.com', '2022-11-05', NULL, 1, 5, 3),
(5, 'Luis', 'Rodriguez', 1050, 300555555, 'Calle 50', 'luis@gmail.com', '2023-03-12', NULL, 1, 7, 4),
(6, 'Pedro', 'Ramirez', 1060, 300666666, 'Calle 60', 'pedro@gmail.com', '2021-07-01', NULL, 1, 8, 4),
(7, 'Laura', 'Torres', 1070, 300777777, 'Calle 70', 'laura@gmail.com', '2024-04-10', NULL, 1, 9, 5);

--
-- Disparadores `empleado`
--
DELIMITER $$
CREATE TRIGGER `trg_empleado_delete` AFTER DELETE ON `empleado` FOR EACH ROW BEGIN
        INSERT INTO empleado_auditoria (
            emp_id,
            emp_nom_old, emp_ape_old, emp_doc_old, emp_tel_old, emp_dir_old, emp_correo_old,
            contrato_ini_old, contrato_fin_old, estado_id_old, hor_id_old, carg_id_old,
            emp_nom_new, emp_ape_new, emp_doc_new, emp_tel_new, emp_dir_new, emp_correo_new,
            contrato_ini_new, contrato_fin_new, estado_id_new, hor_id_new, carg_id_new,
            accion, usuario
        )
        VALUES (
            OLD.emp_id,
            OLD.emp_nom, OLD.emp_ape, OLD.emp_doc, OLD.emp_tel, OLD.emp_dir, OLD.emp_correo,
            OLD.contrato_ini, OLD.contrato_fin, OLD.estado_id, OLD.hor_id, OLD.carg_id,
            'Se elimino los registros del empleado',
            CURRENT_USER()
        );
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_empleado_insert` AFTER INSERT ON `empleado` FOR EACH ROW BEGIN
        INSERT INTO empleado_auditoria (
            emp_id,
            emp_nom_old, emp_ape_old, emp_doc_old, emp_tel_old, emp_dir_old, emp_correo_old,
            contrato_ini_old, contrato_fin_old, estado_id_old, hor_id_old, carg_id_old,
            emp_nom_new, emp_ape_new, emp_doc_new, emp_tel_new, emp_dir_new, emp_correo_new,
            contrato_ini_new, contrato_fin_new, estado_id_new, hor_id_new, carg_id_new,
            accion, usuario
        )
        VALUES (
            NEW.emp_id, NEW.emp_nom, NEW.emp_ape, NEW.emp_doc, NEW.emp_tel, NEW.emp_dir, NEW.emp_correo, NEW.contrato_ini, NEW.contrato_fin, NEW.estado_id, NEW.hor_id, NEW.carg_id,
            'Insertado nuevo empleado',
            CURRENT_USER()
        );
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleado_auditoria`
--

CREATE TABLE `empleado_auditoria` (
  `audit_id` int(11) NOT NULL,
  `emp_id` int(11) DEFAULT NULL,
  `emp_nom_old` varchar(100) DEFAULT NULL,
  `emp_ape_old` varchar(100) DEFAULT NULL,
  `emp_doc_old` int(11) DEFAULT NULL,
  `emp_tel_old` int(11) DEFAULT NULL,
  `emp_dir_old` varchar(255) DEFAULT NULL,
  `emp_correo_old` varchar(255) DEFAULT NULL,
  `contrato_ini_old` date DEFAULT NULL,
  `contrato_fin_old` date DEFAULT NULL,
  `estado_id_old` int(11) DEFAULT NULL,
  `hor_id_old` int(11) DEFAULT NULL,
  `carg_id_old` int(11) DEFAULT NULL,
  `emp_nom_new` varchar(100) DEFAULT NULL,
  `emp_ape_new` varchar(100) DEFAULT NULL,
  `emp_doc_new` int(11) DEFAULT NULL,
  `emp_tel_new` int(11) DEFAULT NULL,
  `emp_dir_new` varchar(255) DEFAULT NULL,
  `emp_correo_new` varchar(255) DEFAULT NULL,
  `contrato_ini_new` date DEFAULT NULL,
  `contrato_fin_new` date DEFAULT NULL,
  `estado_id_new` int(11) DEFAULT NULL,
  `hor_id_new` int(11) DEFAULT NULL,
  `carg_id_new` int(11) DEFAULT NULL,
  `fecha` datetime DEFAULT NULL,
  `usuario` varchar(50) DEFAULT NULL,
  `accion` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado`
--

CREATE TABLE `estado` (
  `estado_id` int(11) NOT NULL,
  `estado_tipo` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado`
--

INSERT INTO `estado` (`estado_id`, `estado_tipo`) VALUES
(1, 'Activo'),
(2, 'Inactivo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horario`
--

CREATE TABLE `horario` (
  `hor_id` int(11) NOT NULL,
  `hor_carg_id` int(11) NOT NULL,
  `hor_jrn` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `horario`
--

INSERT INTO `horario` (`hor_id`, `hor_carg_id`, `hor_jrn`) VALUES
(1, 1, '4:00 AM - 2:00 PM'),
(2, 1, '1:30 PM - 11:00 PM'),
(3, 2, '4:00 AM - 2:00 PM'),
(4, 2, '1:30 PM - 11:00 PM'),
(5, 3, '4:00 AM - 2:00 PM'),
(6, 3, '7:00 AM - 5:00 PM'),
(7, 4, '5:00 AM - 2:00 PM'),
(8, 4, '1:00 PM - 10:00 PM'),
(9, 5, '7:00 AM - 5:00 PM');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horario_cargo`
--

CREATE TABLE `horario_cargo` (
  `hor_carg_id` int(11) NOT NULL,
  `carg_id` int(11) NOT NULL,
  `hor_des` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `horario_cargo`
--

INSERT INTO `horario_cargo` (`hor_carg_id`, `carg_id`, `hor_des`) VALUES
(1, 1, 'Horario Mesero'),
(2, 2, 'Horario Cajero'),
(3, 3, 'Horario Cocinero'),
(4, 4, 'Horario Panadero'),
(5, 5, 'Horario Pastelero');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incapacidad`
--

CREATE TABLE `incapacidad` (
  `inc_id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `inc_fecha` date NOT NULL,
  `inc_estado` varchar(100) NOT NULL,
  `inc_descrip` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `incapacidad`
--

INSERT INTO `incapacidad` (`inc_id`, `emp_id`, `inc_fecha`, `inc_estado`, `inc_descrip`) VALUES
(1, 6, '2026-03-01', 'Activa', 'Dolor lumbar'),
(2, 3, '2026-02-20', 'Finalizada', 'Gripe fuerte');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `memorando`
--

CREATE TABLE `memorando` (
  `mem_id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `mem_fecha` date NOT NULL,
  `mem_tipo` varchar(100) NOT NULL,
  `mem_descrip` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `memorando`
--

INSERT INTO `memorando` (`mem_id`, `emp_id`, `mem_fecha`, `mem_tipo`, `mem_descrip`) VALUES
(1, 2, '2026-03-05', 'Advertencia', 'Retraso en horario'),
(2, 4, '2026-03-07', 'Llamado de atención', 'Uso incorrecto uniforme');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `novedades_certificado`
--

CREATE TABLE `novedades_certificado` (
  `id` bigint(20) NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `proposito` varchar(200) NOT NULL,
  `dirigido_a` varchar(200) DEFAULT NULL,
  `periodo` varchar(100) DEFAULT NULL,
  `fecha_emision` datetime(6) DEFAULT NULL,
  `descargas` int(10) UNSIGNED NOT NULL CHECK (`descargas` >= 0),
  `empleado_id` bigint(20) NOT NULL,
  `generado_por_id` bigint(20) DEFAULT NULL,
  `decision_fecha` datetime(6) DEFAULT NULL,
  `decision_por_id` bigint(20) DEFAULT NULL,
  `estado` varchar(10) NOT NULL,
  `fecha_solicitud` datetime(6) NOT NULL,
  `motivo_rechazo` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `novedades_certificado`
--

INSERT INTO `novedades_certificado` (`id`, `tipo`, `proposito`, `dirigido_a`, `periodo`, `fecha_emision`, `descargas`, `empleado_id`, `generado_por_id`, `decision_fecha`, `decision_por_id`, `estado`, `fecha_solicitud`, `motivo_rechazo`) VALUES
(1, 'laboral', 'tramite bancario', 'eddier paz', NULL, '2026-07-14 03:32:06.878786', 1, 2, 1, '2026-07-14 03:32:06.878889', 1, 'aprobado', '2026-07-14 03:31:19.189504', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `novedades_incapacidad`
--

CREATE TABLE `novedades_incapacidad` (
  `id` bigint(20) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descripcion` longtext NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `archivo` varchar(100) DEFAULT NULL,
  `entidad_emisora` varchar(100) DEFAULT NULL,
  `numero_incapacidad` varchar(50) DEFAULT NULL,
  `estado` varchar(10) NOT NULL,
  `fecha_solicitud` datetime(6) NOT NULL,
  `decision_fecha` datetime(6) DEFAULT NULL,
  `motivo_rechazo` longtext DEFAULT NULL,
  `decision_por_id` bigint(20) DEFAULT NULL,
  `empleado_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `novedades_permiso`
--

CREATE TABLE `novedades_permiso` (
  `id` bigint(20) NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `justificacion` longtext NOT NULL,
  `nuevo_horario` varchar(100) DEFAULT NULL,
  `estado` varchar(10) NOT NULL,
  `fecha_solicitud` datetime(6) NOT NULL,
  `decision_fecha` datetime(6) DEFAULT NULL,
  `motivo_rechazo` longtext DEFAULT NULL,
  `decision_por_id` bigint(20) DEFAULT NULL,
  `empleado_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permiso`
--

CREATE TABLE `permiso` (
  `per_id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `per_fecha` date NOT NULL,
  `per_descrip` varchar(255) NOT NULL,
  `per_estado` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `permiso`
--

INSERT INTO `permiso` (`per_id`, `emp_id`, `per_fecha`, `per_descrip`, `per_estado`) VALUES
(1, 3, '2026-03-10', 'Cita médica', 'Aprobado'),
(2, 5, '2026-03-12', 'Asunto personal', 'Pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tarea`
--

CREATE TABLE `tarea` (
  `tarea_id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `tarea_fecha` date NOT NULL,
  `tarea_descrip` varchar(255) NOT NULL,
  `tarea_estado` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tarea`
--

INSERT INTO `tarea` (`tarea_id`, `emp_id`, `tarea_fecha`, `tarea_descrip`, `tarea_estado`) VALUES
(1, 1, '2026-03-15', 'Lavar baños', 'Pendiente'),
(2, 1, '2026-03-16', 'Limpiar vitrinas', 'Completado'),
(3, 2, '2026-03-16', 'Trapear piso', 'Pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tareas_task`
--

CREATE TABLE `tareas_task` (
  `id` bigint(20) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` longtext NOT NULL,
  `area` varchar(20) NOT NULL,
  `turno_asociado` varchar(20) DEFAULT NULL,
  `prioridad` varchar(10) NOT NULL,
  `estado` varchar(15) NOT NULL,
  `fecha_limite` date NOT NULL,
  `hora_limite` time(6) DEFAULT NULL,
  `fecha_asignacion` datetime(6) NOT NULL,
  `fecha_actualizacion` datetime(6) NOT NULL,
  `creador_id` bigint(20) DEFAULT NULL,
  `empleado_id` bigint(20) NOT NULL,
  `ultimo_cambio_por_id` bigint(20) DEFAULT NULL,
  `fecha_finalizacion` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios_perfilempleado`
--

CREATE TABLE `usuarios_perfilempleado` (
  `id` bigint(20) NOT NULL,
  `primer_nombre` varchar(50) NOT NULL,
  `segundo_nombre` varchar(50) NOT NULL,
  `primer_apellido` varchar(50) NOT NULL,
  `segundo_apellido` varchar(50) NOT NULL,
  `tipo_documento` varchar(2) NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` varchar(1) NOT NULL,
  `estado_civil` varchar(20) DEFAULT NULL,
  `tipo_sangre` varchar(3) DEFAULT NULL,
  `telefono` varchar(20) NOT NULL,
  `correo` varchar(254) NOT NULL,
  `ciudad` varchar(100) NOT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `contacto_emergencia` varchar(100) DEFAULT NULL,
  `telefono_emergencia` varchar(20) DEFAULT NULL,
  `cargo` varchar(50) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `eps` varchar(100) DEFAULT NULL,
  `arl` varchar(100) DEFAULT NULL,
  `fondo_pension` varchar(100) DEFAULT NULL,
  `estado` varchar(20) NOT NULL,
  `fecha_creacion` datetime(6) NOT NULL,
  `fecha_actualizacion` datetime(6) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `parentesco_emergencia` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios_perfilempleado`
--

INSERT INTO `usuarios_perfilempleado` (`id`, `primer_nombre`, `segundo_nombre`, `primer_apellido`, `segundo_apellido`, `tipo_documento`, `numero_documento`, `fecha_nacimiento`, `genero`, `estado_civil`, `tipo_sangre`, `telefono`, `correo`, `ciudad`, `direccion`, `contacto_emergencia`, `telefono_emergencia`, `cargo`, `fecha_ingreso`, `eps`, `arl`, `fondo_pension`, `estado`, `fecha_creacion`, `fecha_actualizacion`, `user_id`, `parentesco_emergencia`) VALUES
(1, 'santiago', '', 'muñeton', 'hernandez', 'CC', '10101010101', '2007-11-24', 'M', 'soltero', 'O+', '1010110110', 'santiago@gmail.com', 'bogotá', 'kr', 'sebastian', '1010101010', 'cajero', '2019-07-20', 'nueva', 'sura', 'porvenir', 'activo', '2026-07-14 03:27:21.247023', '2026-07-14 03:27:21.247092', 1, 'primo'),
(2, 'eddier', 'antonio', 'paz', 'pardo', 'CC', '10101010110', '2004-01-20', 'M', 'soltero', 'O-', '10101010', 'eddier@gmail.com', 'bogota', 'kr', 'santiago', '10101010', 'mesero', '2015-11-24', 'nueva', 'sura', 'porvenir', 'activo', '2026-07-14 03:29:31.231221', '2026-07-14 03:29:31.231287', 2, 'primo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios_user`
--

CREATE TABLE `usuarios_user` (
  `id` bigint(20) NOT NULL,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `rol` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios_user`
--

INSERT INTO `usuarios_user` (`id`, `password`, `last_login`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `date_joined`, `rol`) VALUES
(1, 'pbkdf2_sha256$600000$EoOM9kgEdkqNdh8aqOlLm5$N19wvlM1mFSv1W3VCtP9c9de0CDs+jz5xERbNWu9504=', '2026-07-14 03:31:52.407414', 0, 'admin', '', '', '', 0, 1, '2026-07-14 03:27:18.106889', 'admin'),
(2, 'pbkdf2_sha256$600000$aXkQ5ef6373NnzXPKfei35$3AVxu7D+2UogTKJqjHjljPFuYgjuEKhAGs5Wjv8QhSI=', '2026-07-14 03:32:17.750922', 0, 'empleado', '', '', '', 0, 1, '2026-07-14 03:29:28.335561', 'empleado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios_user_groups`
--

CREATE TABLE `usuarios_user_groups` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios_user_user_permissions`
--

CREATE TABLE `usuarios_user_user_permissions` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_emp_horario`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_emp_horario` (
`emp_id` int(11)
,`NombreCompleto` varchar(201)
,`hor_jrn` varchar(255)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_emp_tarea`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_emp_tarea` (
`emp_id` int(11)
,`NombreCompleto` varchar(201)
,`tarea_fecha` date
,`tarea_descrip` varchar(255)
,`tarea_estado` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_emp_horario`
--
DROP TABLE IF EXISTS `vista_emp_horario`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_emp_horario`  AS SELECT `e`.`emp_id` AS `emp_id`, concat(`e`.`emp_nom`,' ',`e`.`emp_ape`) AS `NombreCompleto`, `h`.`hor_jrn` AS `hor_jrn` FROM (`empleado` `e` join `horario` `h` on(`h`.`hor_id` = `e`.`hor_id`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_emp_tarea`
--
DROP TABLE IF EXISTS `vista_emp_tarea`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_emp_tarea`  AS SELECT `e`.`emp_id` AS `emp_id`, concat(`e`.`emp_nom`,' ',`e`.`emp_ape`) AS `NombreCompleto`, `t`.`tarea_fecha` AS `tarea_fecha`, `t`.`tarea_descrip` AS `tarea_descrip`, `t`.`tarea_estado` AS `tarea_estado` FROM (`empleado` `e` join `tarea` `t` on(`t`.`emp_id` = `e`.`emp_id`)) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asistencia_asistencia`
--
ALTER TABLE `asistencia_asistencia`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `asistencia_asistencia_horario_id_fecha_2fd48213_uniq` (`horario_id`,`fecha`);

--
-- Indices de la tabla `asistencia_descansoempleado`
--
ALTER TABLE `asistencia_descansoempleado`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `asistencia_descansoempleado_horario_id_fecha_23057295_uniq` (`horario_id`,`fecha`);

--
-- Indices de la tabla `asistencia_horario`
--
ALTER TABLE `asistencia_horario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asistencia_horario_empleado_id_d9c2a53d_fk_usuarios_` (`empleado_id`);

--
-- Indices de la tabla `auth_group`
--
ALTER TABLE `auth_group`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  ADD KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`);

--
-- Indices de la tabla `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`);

--
-- Indices de la tabla `cargo`
--
ALTER TABLE `cargo`
  ADD PRIMARY KEY (`carg_id`);

--
-- Indices de la tabla `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  ADD KEY `django_admin_log_user_id_c564eba6_fk` (`user_id`);

--
-- Indices de la tabla `django_content_type`
--
ALTER TABLE `django_content_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`);

--
-- Indices de la tabla `django_migrations`
--
ALTER TABLE `django_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `django_session`
--
ALTER TABLE `django_session`
  ADD PRIMARY KEY (`session_key`),
  ADD KEY `django_session_expire_date_a5c62663` (`expire_date`);

--
-- Indices de la tabla `empleado`
--
ALTER TABLE `empleado`
  ADD PRIMARY KEY (`emp_id`),
  ADD KEY `estado_id` (`estado_id`),
  ADD KEY `hor_id` (`hor_id`),
  ADD KEY `carg_id` (`carg_id`);

--
-- Indices de la tabla `empleado_auditoria`
--
ALTER TABLE `empleado_auditoria`
  ADD PRIMARY KEY (`audit_id`);

--
-- Indices de la tabla `estado`
--
ALTER TABLE `estado`
  ADD PRIMARY KEY (`estado_id`);

--
-- Indices de la tabla `horario`
--
ALTER TABLE `horario`
  ADD PRIMARY KEY (`hor_id`),
  ADD KEY `hor_carg_id` (`hor_carg_id`);

--
-- Indices de la tabla `horario_cargo`
--
ALTER TABLE `horario_cargo`
  ADD PRIMARY KEY (`hor_carg_id`),
  ADD KEY `carg_id` (`carg_id`);

--
-- Indices de la tabla `incapacidad`
--
ALTER TABLE `incapacidad`
  ADD PRIMARY KEY (`inc_id`),
  ADD KEY `emp_id` (`emp_id`);

--
-- Indices de la tabla `memorando`
--
ALTER TABLE `memorando`
  ADD PRIMARY KEY (`mem_id`),
  ADD KEY `emp_id` (`emp_id`);

--
-- Indices de la tabla `novedades_certificado`
--
ALTER TABLE `novedades_certificado`
  ADD PRIMARY KEY (`id`),
  ADD KEY `novedades_certificad_empleado_id_5240301b_fk_usuarios_` (`empleado_id`),
  ADD KEY `novedades_certificad_generado_por_id_01dd9117_fk_usuarios_` (`generado_por_id`),
  ADD KEY `novedades_certificad_decision_por_id_78532c04_fk_usuarios_` (`decision_por_id`);

--
-- Indices de la tabla `novedades_incapacidad`
--
ALTER TABLE `novedades_incapacidad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `novedades_incapacida_decision_por_id_ecb4754d_fk_usuarios_` (`decision_por_id`),
  ADD KEY `novedades_incapacida_empleado_id_0f4df1f6_fk_usuarios_` (`empleado_id`);

--
-- Indices de la tabla `novedades_permiso`
--
ALTER TABLE `novedades_permiso`
  ADD PRIMARY KEY (`id`),
  ADD KEY `novedades_permiso_decision_por_id_3594e8f6_fk_usuarios_user_id` (`decision_por_id`),
  ADD KEY `novedades_permiso_empleado_id_c305f4ff_fk_usuarios_` (`empleado_id`);

--
-- Indices de la tabla `permiso`
--
ALTER TABLE `permiso`
  ADD PRIMARY KEY (`per_id`),
  ADD KEY `emp_id` (`emp_id`);

--
-- Indices de la tabla `tarea`
--
ALTER TABLE `tarea`
  ADD PRIMARY KEY (`tarea_id`),
  ADD KEY `emp_id` (`emp_id`);

--
-- Indices de la tabla `tareas_task`
--
ALTER TABLE `tareas_task`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tareas_task_creador_id_6bc413f8_fk_usuarios_user_id` (`creador_id`),
  ADD KEY `tareas_task_ultimo_cambio_por_id_b82c5869_fk_usuarios_user_id` (`ultimo_cambio_por_id`),
  ADD KEY `tareas_task_empleado_id_ad254609` (`empleado_id`);

--
-- Indices de la tabla `usuarios_perfilempleado`
--
ALTER TABLE `usuarios_perfilempleado`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_documento` (`numero_documento`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indices de la tabla `usuarios_user`
--
ALTER TABLE `usuarios_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indices de la tabla `usuarios_user_groups`
--
ALTER TABLE `usuarios_user_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuarios_user_groups_user_id_group_id_7ca6624e_uniq` (`user_id`,`group_id`),
  ADD KEY `usuarios_user_groups_group_id_ce48ebfd_fk_auth_group_id` (`group_id`);

--
-- Indices de la tabla `usuarios_user_user_permissions`
--
ALTER TABLE `usuarios_user_user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuarios_user_user_permi_user_id_permission_id_801d2da9_uniq` (`user_id`,`permission_id`),
  ADD KEY `usuarios_user_user_p_permission_id_32dd035e_fk_auth_perm` (`permission_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asistencia_asistencia`
--
ALTER TABLE `asistencia_asistencia`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `asistencia_descansoempleado`
--
ALTER TABLE `asistencia_descansoempleado`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `asistencia_horario`
--
ALTER TABLE `asistencia_horario`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `auth_group`
--
ALTER TABLE `auth_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `auth_permission`
--
ALTER TABLE `auth_permission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT de la tabla `django_admin_log`
--
ALTER TABLE `django_admin_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `django_content_type`
--
ALTER TABLE `django_content_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `django_migrations`
--
ALTER TABLE `django_migrations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de la tabla `empleado_auditoria`
--
ALTER TABLE `empleado_auditoria`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `novedades_certificado`
--
ALTER TABLE `novedades_certificado`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `novedades_incapacidad`
--
ALTER TABLE `novedades_incapacidad`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `novedades_permiso`
--
ALTER TABLE `novedades_permiso`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tareas_task`
--
ALTER TABLE `tareas_task`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios_perfilempleado`
--
ALTER TABLE `usuarios_perfilempleado`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuarios_user`
--
ALTER TABLE `usuarios_user`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuarios_user_groups`
--
ALTER TABLE `usuarios_user_groups`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios_user_user_permissions`
--
ALTER TABLE `usuarios_user_user_permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asistencia_asistencia`
--
ALTER TABLE `asistencia_asistencia`
  ADD CONSTRAINT `asistencia_asistenci_horario_id_b223b06a_fk_asistenci` FOREIGN KEY (`horario_id`) REFERENCES `asistencia_horario` (`id`);

--
-- Filtros para la tabla `asistencia_descansoempleado`
--
ALTER TABLE `asistencia_descansoempleado`
  ADD CONSTRAINT `asistencia_descansoe_horario_id_8f7e6a97_fk_asistenci` FOREIGN KEY (`horario_id`) REFERENCES `asistencia_horario` (`id`);

--
-- Filtros para la tabla `asistencia_horario`
--
ALTER TABLE `asistencia_horario`
  ADD CONSTRAINT `asistencia_horario_empleado_id_d9c2a53d_fk_usuarios_` FOREIGN KEY (`empleado_id`) REFERENCES `usuarios_perfilempleado` (`id`);

--
-- Filtros para la tabla `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);

--
-- Filtros para la tabla `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);

--
-- Filtros para la tabla `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  ADD CONSTRAINT `django_admin_log_user_id_c564eba6_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios_user` (`id`);

--
-- Filtros para la tabla `empleado`
--
ALTER TABLE `empleado`
  ADD CONSTRAINT `empleado_ibfk_1` FOREIGN KEY (`estado_id`) REFERENCES `estado` (`estado_id`),
  ADD CONSTRAINT `empleado_ibfk_2` FOREIGN KEY (`hor_id`) REFERENCES `horario` (`hor_id`),
  ADD CONSTRAINT `empleado_ibfk_3` FOREIGN KEY (`carg_id`) REFERENCES `cargo` (`carg_id`);

--
-- Filtros para la tabla `horario`
--
ALTER TABLE `horario`
  ADD CONSTRAINT `horario_ibfk_1` FOREIGN KEY (`hor_carg_id`) REFERENCES `horario_cargo` (`hor_carg_id`);

--
-- Filtros para la tabla `horario_cargo`
--
ALTER TABLE `horario_cargo`
  ADD CONSTRAINT `horario_cargo_ibfk_1` FOREIGN KEY (`carg_id`) REFERENCES `cargo` (`carg_id`);

--
-- Filtros para la tabla `incapacidad`
--
ALTER TABLE `incapacidad`
  ADD CONSTRAINT `incapacidad_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `empleado` (`emp_id`);

--
-- Filtros para la tabla `memorando`
--
ALTER TABLE `memorando`
  ADD CONSTRAINT `memorando_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `empleado` (`emp_id`);

--
-- Filtros para la tabla `novedades_certificado`
--
ALTER TABLE `novedades_certificado`
  ADD CONSTRAINT `novedades_certificad_decision_por_id_78532c04_fk_usuarios_` FOREIGN KEY (`decision_por_id`) REFERENCES `usuarios_user` (`id`),
  ADD CONSTRAINT `novedades_certificad_empleado_id_5240301b_fk_usuarios_` FOREIGN KEY (`empleado_id`) REFERENCES `usuarios_perfilempleado` (`id`),
  ADD CONSTRAINT `novedades_certificad_generado_por_id_01dd9117_fk_usuarios_` FOREIGN KEY (`generado_por_id`) REFERENCES `usuarios_user` (`id`);

--
-- Filtros para la tabla `novedades_incapacidad`
--
ALTER TABLE `novedades_incapacidad`
  ADD CONSTRAINT `novedades_incapacida_decision_por_id_ecb4754d_fk_usuarios_` FOREIGN KEY (`decision_por_id`) REFERENCES `usuarios_user` (`id`),
  ADD CONSTRAINT `novedades_incapacida_empleado_id_0f4df1f6_fk_usuarios_` FOREIGN KEY (`empleado_id`) REFERENCES `usuarios_perfilempleado` (`id`);

--
-- Filtros para la tabla `novedades_permiso`
--
ALTER TABLE `novedades_permiso`
  ADD CONSTRAINT `novedades_permiso_decision_por_id_3594e8f6_fk_usuarios_user_id` FOREIGN KEY (`decision_por_id`) REFERENCES `usuarios_user` (`id`),
  ADD CONSTRAINT `novedades_permiso_empleado_id_c305f4ff_fk_usuarios_` FOREIGN KEY (`empleado_id`) REFERENCES `usuarios_perfilempleado` (`id`);

--
-- Filtros para la tabla `permiso`
--
ALTER TABLE `permiso`
  ADD CONSTRAINT `permiso_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `empleado` (`emp_id`);

--
-- Filtros para la tabla `tarea`
--
ALTER TABLE `tarea`
  ADD CONSTRAINT `tarea_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `empleado` (`emp_id`);

--
-- Filtros para la tabla `tareas_task`
--
ALTER TABLE `tareas_task`
  ADD CONSTRAINT `tareas_task_creador_id_6bc413f8_fk_usuarios_user_id` FOREIGN KEY (`creador_id`) REFERENCES `usuarios_user` (`id`),
  ADD CONSTRAINT `tareas_task_empleado_id_ad254609_fk_usuarios_perfilempleado_id` FOREIGN KEY (`empleado_id`) REFERENCES `usuarios_perfilempleado` (`id`),
  ADD CONSTRAINT `tareas_task_ultimo_cambio_por_id_b82c5869_fk_usuarios_user_id` FOREIGN KEY (`ultimo_cambio_por_id`) REFERENCES `usuarios_user` (`id`);

--
-- Filtros para la tabla `usuarios_perfilempleado`
--
ALTER TABLE `usuarios_perfilempleado`
  ADD CONSTRAINT `usuarios_perfilempleado_user_id_727d8dff_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios_user` (`id`);

--
-- Filtros para la tabla `usuarios_user_groups`
--
ALTER TABLE `usuarios_user_groups`
  ADD CONSTRAINT `usuarios_user_groups_group_id_ce48ebfd_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  ADD CONSTRAINT `usuarios_user_groups_user_id_327741ca_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios_user` (`id`);

--
-- Filtros para la tabla `usuarios_user_user_permissions`
--
ALTER TABLE `usuarios_user_user_permissions`
  ADD CONSTRAINT `usuarios_user_user_p_permission_id_32dd035e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `usuarios_user_user_permissions_user_id_6770e840_fk` FOREIGN KEY (`user_id`) REFERENCES `usuarios_user` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
