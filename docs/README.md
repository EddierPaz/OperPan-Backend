
1. ¿Confirmamos definitivamente que en OperPan existen únicamente estos dos roles?

   * Administrador
   * Empleado

SI

2. ¿Cuántos administradores quieres que tenga la BD poblada?

   * ¿2?
   * ¿Otro número?

Quiero que tenga 4 administradores que estos tienen cargo de cajeros y seran:

Administradores: paula, eddier, santiago, martina
Quiero que para todos estos admins la contraseña sea: 12345

3. ¿Todos los empleados deben tener obligatoriamente una cuenta de usuario?

Si

4. ¿Puede existir un usuario sin estar asociado a un empleado?

No

5. ¿Puede existir un empleado sin cuenta de usuario?

No

6. ¿El nombre de usuario debe ser único?

Si, sin tildes. Ni nombres raros, en teoria tal vez nombre y apellido pegado y sin espacio.

7. ¿El correo electrónico debe ser único?

Si

8. ¿El número de documento debe ser único?

Si, y que cumpla con la cantidad de numeros que es un documento real

9. ¿Quieres que existan empleados con cuentas inactivas para probar esa funcionalidad?

Si.

10. Si un empleado está inactivo:

* ¿Debe quedar sin acceso al sistema?

Asi es, no debe poder ingresar

* ¿Debe conservar su historial de asistencia, tareas y solicitudes?

Si, pero entonces este historial general se debe eliminar a los 3 meses por si acaso.

* ¿Puede tener tareas o solicitudes activas?

NO

11. ¿Qué estados de cuenta quieres representar en los datos?

* Activo
* Inactivo
* Pendiente
* Suspendido

Asi es.

12. ¿Todos los usuarios creados por el script deben tener una contraseña válida conocida para pruebas?
si, la que deseamos es que sea 12345

---

# 2. Información de empleados

13. ¿Cada empleado debe pertenecer obligatoriamente a un cargo?

Si

14. ¿Cada empleado debe pertenecer obligatoriamente a un área?

En este momento la nomenclatura no es area todavia, no la utilizamos

15. ¿Un empleado puede pertenecer a más de un área?

...

16. ¿Un empleado puede tener más de un cargo?
No


17. ¿Quieres que los cargos estén relacionados lógicamente con las áreas?

...

18. ¿Quieres que el LLM respete una matriz fija `cargo → área` al generar datos?

...

19. ¿Los datos personales del usuario y del perfil del empleado deben coincidir exactamente?

Totalmente

20. Si existe correo tanto en Usuario como en PerfilEmpleado, ¿cuál debe considerarse la fuente de verdad?

¿Cual consideras tu analizandolo? O cómo puedo determinar cual deberia ser?
 
21. ¿Quieres empleados de distintas ciudades aunque la empresa esté en Soacha, o prefieres que todos residan principalmente en Soacha/Bogotá?

No.

22. ¿Quieres datos completamente ficticios pero realistas, evitando nombres, teléfonos, documentos o correos evidentemente artificiales?

Si.

---

# 3. Horarios

Esta es una de las partes más importantes porque afecta directamente la asistencia.

23. ¿Cada empleado debe tener obligatoriamente un horario asignado?

Si.

24. ¿Un empleado puede tener diferentes horarios durante la semana?

Hay 3 turnos y cambia cada semana

Fijo: Trabajan todo el tiempo en el mismo horario, y su descanso es el mismo dia cada 8 dias

Y los que no son fijos que son de mañana y tarde: Estos se cambian manual por el administrador y los descansos consisten en una logica que de lunes a viernes, cada semana se va cambiando de lunes, si se descanso el lunes sigue martes, si se descanso martes sigue miercoles y asi con esa logica sin contar los dias sabado y domingo.

Por ejemplo:

* Lunes: 06:00–14:00
* Martes: 06:00–14:00
* Miércoles: 14:00–22:00

¿O cada empleado tiene un horario fijo?

No necesariamente

25. ¿Un horario pertenece a un empleado o puede ser utilizado por varios empleados?

Un horario, puede pertenecer a varios empleados. Por lo que en un dia normal en un solo horario hay un total y un al rededor de 7 empleados por horario



26. ¿Quieres manejar horarios como registros reutilizables?

Ejemplo:

* Horario Mañana → 06:00–14:00
* Horario Tarde → 14:00–22:00
* Horario Partido → 08:00–18:00

No entendi esto, ¿Qué significa?

27. ¿Cuáles son realmente los horarios que utiliza La Estación Paisa?

Mañana, tarde, y fijo




28. ¿Existen jornadas de 10 horas como las que aparecen actualmente en el script?

> Estas son las horas de los horarios para que se manejen los datos

Mañana 4am - 2pm

Noche: 1:30pm a 11pm

Fijo: 8am a 5pm


29. ¿Existe una hora máxima de entrada válida?

Pongamos que maximo 15 minutos sea una entrada valida.

30. ¿Existe una hora mínima de entrada?

La hora de inicio del horario.

31. ¿Los horarios tienen días específicos de la semana?

No, es por la hora unicamente

32. ¿El horario determina automáticamente el día de descanso del empleado?

Si pues el fijo descansa el mismo dia de la semana, cada semana

Y si es mañana o tarde estos descansan un dia siguente al del anterior descanso, es decir:

Logica de: Si descanso lunes, proximo descanso es el martes y asi todos los dias de Lunes a viernes y sin importar el sabado y el domingo no hay descanso en la BD a no ser que el adminsitrador lo halla permitido

---

# 4. Días de descanso

Aquí necesitamos eliminar la ambigüedad que encontramos en el script.

33. ¿Todos los empleados descansan los domingos?

No.

34. Si no, ¿cada empleado tiene un día de descanso diferente?

Si.

35. ¿Puede un empleado tener más de un día de descanso semanal?

No.

36. ¿El día de descanso es fijo o puede cambiar?

Si es horario fijo, el dia es fijo. Y si no no.

37. ¿El descanso debe registrarse en una tabla específica de descansos?

No, unicamente como la logica actual que viste.

38. Si un empleado está descansando:

* ¿No debe generarse asistencia?

Asi es, no debe generarse asistencia.

* ¿Debe generarse un registro con estado `DESCANSO`?

Tal vez sea una lógica que deberiamos implementar, pero en el estado de registros de asistencia actualmente tenemos: presente, tarde y ausente. Por lo que por ahora sigue de largo este.

* ¿Debe quedar simplemente sin registro?

Posiblemente

39. ¿Quieres que existan empleados trabajando domingos para demostrar que no todos descansan ese día?

Asi es, habran empleados trabajando el domingo de acuerdo a lo que te he dicho

---

# 5. Asistencia

Este es probablemente el conjunto de reglas más crítico.

40. ¿Cuál es la tolerancia exacta para llegar a tiempo?

* 15 minutos

41. ¿Qué ocurre después de superar esa tolerancia?

`06:15` → TARDE

42. ¿Qué estados de asistencia existen exactamente en OperPan?

Necesito los valores reales que quieres utilizar, por ejemplo:

* PRESENTE
* TARDE
* AUSENTE

43. ¿Existe un estado `RETARDO` o debemos utilizar `TARDE`?

Tarde

44. ¿La asistencia debe generarse únicamente para días laborales?

Pues los dias de trabajo, si llego tarde, y el dia de descanso

45. ¿Qué ocurre en un día festivo?

Nada, lo normal

46. ¿Debe existir registro de asistencia en un festivo?

Si claro, normal

47. ¿Qué festivos quieres contemplar para el período de prueba?

Los normales

48. ¿El script debe calcular automáticamente los festivos o podemos definirlos manualmente?

Tu en el prompt haz estos festivos o posiblemetne ignoralos, es un dia laboral igual.


49. La hora de entrada debe calcularse respecto al horario individual del empleado, ¿correcto?

Si.

50. ¿Quieres que las horas de asistencia sean aleatorias dentro de rangos realistas?

Totalmente

51. ¿Qué porcentaje aproximado quieres de:

* Puntualidad

La mayoria seran puntuales

* Tardanzas

Muy pocos

* Ausencias?

Todavia más pocos

52. ¿Quieres que determinados empleados tengan patrones específicos?

Si, totalmente

---

# 6. Novedades que afectan asistencia

53. Si un empleado tiene una incapacidad aprobada para una fecha, ¿debe existir asistencia ese día?

**No.**

54. Si tiene un permiso aprobado para una fecha, ¿debe existir asistencia?

No

55. Si tiene vacaciones aprobadas, ¿debe existir asistencia?

No.

56. Si tiene un cambio de turno aprobado, ¿la asistencia debe evaluarse utilizando el nuevo horario?

Si. Pues con los dias correspondientes a ese horario

57. Si una novedad cubre varios días, ¿debe afectar cada uno de esos días?

Si

58. ¿Qué debe ocurrir con una novedad `PENDIENTE`?

¿Debe afectar la asistencia?

No.

59. ¿Y una novedad `RECHAZADA`?

Tampoco debe afectar

60. ¿Cuál debe ser la prioridad si existen dos novedades para la misma fecha?

Por ejemplo:

> Vacaciones aprobadas
> +
> Incapacidad aprobada

¿Se permite? ¿Cuál prevalece? ¿O directamente no debe existir ese escenario?

Pues inicialmente maximo 2 novedades con un mismo empleado

61. ¿Quieres que el script **nunca genere solapamientos** entre novedades aprobadas?

Mi recomendación sería sí.

---

# 7. Incapacidades

62. ¿Una incapacidad requiere obligatoriamente fecha inicial y fecha final?

Si.

63. ¿Puede durar un solo día?

Si.

64. ¿Puede estar:

* Pendiente
* Aprobada
* Rechazada?

Si.

65. ¿Quién aprueba/rechaza una incapacidad?

El adminsitrador

66. Si está aprobada, ¿debe necesariamente tener `decision_por_id`?

Si, creo.

67. Si está pendiente, ¿debe `decision_por_id` ser NULL?

Si.

68. ¿Una incapacidad aprobada debe impedir que el empleado tenga vacaciones o permiso aprobado durante esas mismas fechas?

no debe impedirlo, pues si un empleado tiene una incapacidad dias antes de sus vacaciones, sus vacaciones pues tendrian tiempo en su incapacidad.

69. ¿Quieres incapacidades de diferentes duraciones para probar la aplicación?

Si.

---

# 8. Permisos

70. ¿Qué tipos de permisos existen realmente?

Pues piensa en tu en cuales serian los más normales, porque estos permisos con abiertos por lo que pueden ser muy variados, toma los más comunes

71. ¿Un permiso puede durar:

* unas horas,

Si, 

* un día,

Si

* varios días?

Si

72. ¿Los permisos necesitan una hora de inicio y finalización?

Si

73. ¿Un permiso puede ser aprobado aunque coincida parcialmente con la jornada?

Si

74. ¿Un permiso aprobado debe impedir que se registre una asistencia normal durante el período cubierto?

Si

75. ¿Quieres empleados con permisos:

* aprobados,
* pendientes,
* rechazados?

Si

76. ¿Quieres diferentes motivos de permiso?

Si

---

# 9. Vacaciones

Aquí quiero confirmar algo importante que detectamos.

77. ¿Las vacaciones están almacenadas técnicamente como un tipo de permiso/novedad?


Si

78. ¿El valor debe ser exactamente algo como:

`tipo = 'vacaciones'`

Esta bien

79. ¿Las vacaciones requieren aprobación?

Si

80. ¿Una solicitud de vacaciones pendiente debe afectar asistencia?

Si

81. ¿Una solicitud aprobada sí debe bloquear la generación de asistencia?

82. ¿Quieres que existan vacaciones de varios días?
si
83. ¿Quieres evitar que las vacaciones coincidan con incapacidades y permisos?
Si, lo escencial es no cruzar este tipo de solicitudes.
84. ¿Quieres manejar días hábiles para vacaciones o simplemente rangos de fechas?
se maneja de acuerdo a la ley colombiana, y va de acuerdo a rango de fechas.
---

# 10. Cambio de turno

85. ¿El cambio de turno requiere aprobación?
si

86. ¿Cuando se aprueba, cambia realmente el horario del empleado para esa fecha?

Por ejemplo:

Empleado normalmente:

`06:00–14:00`

Cambio aprobado:

`14:00–22:00`

¿La asistencia debe evaluarse contra las `14:00`?

87. ¿El cambio de turno es temporal para una fecha/rango o modifica permanentemente el horario?
se puede cambiar desde el siguiente día (día aplicable el cambio), puede haber la posibilidad de cambiar permanente el horario, pero es un caso extremo.

88. ¿Puede solicitarse un cambio de turno a otro horario existente?

89. ¿Debe existir una relación directa entre el cambio de turno y el horario destino?

90. ¿Puede haber cambios de turno pendientes, aprobados y rechazados?
si

91. ¿Quieres evitar dos cambios de turno simultáneos para el mismo empleado?
si


# 11. Solicitudes en general

92. ¿Todas las solicitudes tienen estados:

* Pendiente
* Aprobada
* Rechazada

o existen otros? no

93. ¿Todas las solicitudes deben tener fecha de creación?
si

94. ¿Todas las solicitudes deben estar asociadas obligatoriamente a un empleado?
si
95. ¿Todas las solicitudes aprobadas deben registrar quién tomó la decisión?
si
96. ¿Todas las solicitudes rechazadas también deben registrar quién tomó la decisión?
si
97. ¿Una solicitud pendiente debe tener `decision_por_id = NULL`?

98. ¿Quieres que las fechas de decisión siempre sean posteriores o iguales a la fecha de creación?

99. ¿Un empleado puede tener varias solicitudes simultáneamente?

100. ¿Quieres que el script genere solicitudes realistas distribuidas entre los 30 empleados y no concentradas únicamente en unos pocos?

---

# 12. Certificados

101. ¿Qué tipos de certificados puede solicitar un empleado?

102. ¿Todos los certificados requieren aprobación administrativa?

103. ¿Un certificado rechazado puede ser generado?

104. ¿Un certificado pendiente puede tener `generado_por_id`?

105. ¿Un certificado aprobado debe obligatoriamente tener `decision_por_id`?

106. ¿El PDF se genera únicamente después de la aprobación?

107. ¿Quieres que existan certificados:

* pendientes,
* aprobados,
* rechazados?

108. ¿Quieres múltiples certificados por empleado?

109. ¿Hay algún límite de solicitudes de certificados?

---

# 13. Tareas

110. ¿Quién puede crear tareas?

111. ¿Las tareas pueden asignarse únicamente a empleados?

112. ¿Una tarea puede asignarse a varios empleados?

113. ¿Una tarea debe estar relacionada con el cargo del empleado?

114. ¿Debe existir una relación obligatoria:

`Cargo → Área → Tipo de tarea`?

115. ¿Un mesero puede recibir una tarea de limpieza de hornos?

Aquí necesito saber si debemos considerar eso:

* válido,
* inválido,
* válido dependiendo de la situación.

116. ¿Qué estados de tarea existen exactamente?

117. ¿Una tarea puede estar:

* Pendiente
* En progreso
* Completada
* Vencida
* Cancelada

o cuáles?

118. ¿Una tarea tiene fecha límite?

119. ¿Puede una tarea completarse después de su fecha límite?

120. ¿Una tarea vencida debe cambiar automáticamente de estado?

121. ¿Una tarea completada debe tener obligatoriamente fecha de finalización?

122. ¿Una tarea cancelada debe tener algún motivo?

123. ¿Quieres tareas específicamente diseñadas para probar el dashboard?

Por ejemplo:

* tareas pendientes,
* tareas vencidas,
* tareas completadas,
* tareas próximas a vencer.

---

# 14. Memorandos

Esta parte es fundamental para que los datos tengan coherencia con asistencia.

124. ¿Quién puede generar un memorando?

125. ¿Un memorando siempre pertenece a un empleado?

126. ¿Qué tipos de memorandos existen?

127. ¿Un memorando disciplinario debe tener una justificación?

128. Si generamos un memorando por **“Retrasos reiterados”**, ¿quieres que el script compruebe que ese empleado realmente tenga varias tardanzas?

Mi recomendación es **sí**.

129. ¿Cuántas tardanzas deben justificar un memorando?

Por ejemplo:

`3 tardanzas dentro de 7 días`.

130. ¿Quieres otros memorandos automáticos relacionados con:

* ausencias,
* incumplimiento de tareas,
* retrasos,
* comportamiento?

131. ¿Un memorando puede estar relacionado con una asistencia específica?

132. ¿Un memorando puede estar relacionado con una tarea específica?

133. ¿Los memorandos tienen estados?

134. ¿Quién los genera?

---

# 15. Reconocimientos

En el script actual también encontramos registros de reconocimiento.

135. ¿Los reconocimientos forman realmente parte de OperPan?

136. ¿Quién puede otorgarlos?

137. ¿Qué motivos de reconocimiento existen?

138. ¿Quieres que los reconocimientos tengan relación con:

* tareas completadas,
* puntualidad,
* desempeño,
* comportamiento?

139. ¿O son registros completamente independientes?

---

# 16. Auditoría

140. ¿Quieres que **cada creación/modificación relevante** tenga registro de auditoría?

141. ¿Qué acciones deben auditarse?

Por ejemplo:

* Crear usuario
* Modificar usuario
* Crear empleado
* Crear horario
* Registrar asistencia
* Crear solicitud
* Aprobar solicitud
* Rechazar solicitud
* Crear tarea
* Completar tarea
* Crear memorando

142. Si el script crea automáticamente datos, ¿la auditoría debe decir:

`SISTEMA`

o debe simular que un administrador realizó las operaciones?

143. ¿Quieres que los 32 usuarios creados tengan sus correspondientes registros de auditoría?

144. ¿Qué usuario administrador debe aparecer como responsable de las acciones administrativas?

145. ¿Quieres que existan eventos de auditoría de diferentes fechas para simular historial real?

---

# 17. Fechas generales del sistema

146. ¿Qué período quieres que cubra la base de datos poblada?

Actualmente el script utiliza principalmente julio, agosto y septiembre de 2026.

¿Mantenemos:

**julio–septiembre de 2026**?

147. ¿Quieres datos históricos de meses anteriores?

148. ¿Quieres que existan datos futuros respecto a la fecha actual?

149. ¿Las solicitudes futuras son válidas?

150. ¿Quieres que el script esté diseñado para una fecha fija de pruebas o que calcule fechas dinámicamente respecto a `CURDATE()`?

Para una BD de demostración normalmente recomiendo **período fijo**, porque hace reproducibles los resultados.

---

# 18. Datos realistas y distribución

151. ¿Quieres que los 30 empleados estén distribuidos de manera equilibrada entre cargos?

152. ¿Quieres una distribución específica?

Por ejemplo:

* 8 producción
* 5 caja
* 5 repostería
* 6 mostrador
* 3 limpieza
* 3 aseo

153. ¿Quieres una distribución equilibrada entre horarios?

154. ¿Quieres que existan empleados con comportamiento diferente?

Por ejemplo:

| Perfil       | Comportamiento             |
| ------------ | -------------------------- |
| Excelente    | puntual, tareas completas  |
| Normal       | algunas tardanzas          |
| Problemático | varias tardanzas/ausencias |
| Nuevo        | pocos registros históricos |

Esto permitiría probar mucho mejor el sistema.

155. ¿Quieres que los datos estén diseñados específicamente para que el **Dashboard del Administrador** muestre información variada?

156. ¿Quieres que el **Dashboard del Empleado** también tenga información significativa para diferentes empleados?

---

# 19. Coherencia entre módulos

Estas son las reglas que considero más importantes para el nuevo generador.

157. ¿Confirmamos que una misma persona debe mantener exactamente la misma identidad en todas las tablas?

158. ¿Confirmamos que un empleado no puede tener asistencia incompatible con una incapacidad aprobada?

159. ¿Confirmamos que un empleado no puede tener asistencia incompatible con vacaciones aprobadas?

160. ¿Confirmamos que un empleado no puede tener asistencia incompatible con un permiso aprobado?

161. ¿Confirmamos que un cambio de turno aprobado debe modificar la referencia horaria de la asistencia?

162. ¿Confirmamos que las tardanzas deben poder comprobarse consultando la tabla de asistencia?

163. ¿Confirmamos que un memorando que afirma una conducta debe tener evidencia real en otras tablas?

164. ¿Confirmamos que una solicitud aprobada debe tener responsable de aprobación?

165. ¿Confirmamos que una solicitud pendiente no debe tener responsable de aprobación?

166. ¿Confirmamos que las fechas relacionadas deben respetar una secuencia lógica?

Ejemplo:

`fecha_creacion <= fecha_decision`

167. ¿Quieres que el script priorice **coherencia de negocio sobre aleatoriedad**?

Es decir, que no simplemente genere datos random, sino que primero construya un escenario lógico y después genere los registros derivados.

**Yo recomiendo fuertemente esta opción.**

---

# 20. Preguntas sobre el propio script SQL

168. ¿Quieres conservar exactamente la estructura actual de tablas y columnas y únicamente modificar los `INSERT`?

169. ¿O permitiremos que el LLM proponga cambios al script si encuentra que alguna estructura dificulta representar correctamente una regla?

170. ¿El LLM debe asumir que las tablas y columnas actuales son definitivas?

171. ¿Quieres que el nuevo script sea completamente ejecutable desde cero?

Es decir:

```text
limpiar datos
↓
crear usuarios
↓
crear empleados
↓
crear cargos/áreas
↓
crear horarios
↓
crear descansos
↓
crear novedades
↓
crear asistencia coherente
↓
crear tareas
↓
crear memorandos
↓
crear certificados
↓
crear auditoría
```

172. ¿Quieres que el LLM incluya comentarios SQL explicando las reglas importantes?

173. ¿Quieres que el script utilice variables/CTEs/procedimientos para generar los datos o prefieres `INSERT` explícitos?

174. ¿Quieres priorizar legibilidad del SQL o eficiencia de ejecución?

---

# 21. Una pregunta especialmente importante: ¿debemos revisar los modelos Django?

Hay una última decisión que considero fundamental antes de construir el prompt definitivo:

**¿Quieres que el LLM genere el SQL únicamente basándose en el script actual y en nuestras reglas, o debe además analizar los `models.py` reales de OperPan para garantizar que los nombres de columnas, relaciones, estados, `ForeignKey`, `choices`, `NULL`, etc. coincidan exactamente con Django?**

Mi recomendación es:

> **Que analice los modelos reales antes de generar el SQL definitivo.**

Porque una regla de negocio puede estar perfectamente definida y aun así el SQL fallar si el modelo Django realmente utiliza otra relación, otro nombre de campo o un `choices` diferente.

---

## Cómo te recomiendo responder

No necesitas responder las 174 preguntas de manera artificialmente numerada si algunas no aplican. Puedes responder por bloques:

**1. Usuarios:**
23. Sí.
24. No.
25. Solo 2 administradores.
...

**2. Horarios:**
...

**3. Asistencia:**
...

Y en las preguntas donde todavía no tengas una decisión, puedes poner simplemente:

> **“No sé, propón la regla que consideres más coherente con OperPan.”**

En esas partes yo tomaré una decisión de ingeniería de requisitos y te explicaré por qué.

Cuando terminemos este cuestionario, el siguiente paso será construir **un único prompt maestro para el otro LLM**, donde no solo le diremos “genera un SQL”, sino que le daremos:

**Contexto de OperPan → estructura existente → reglas de negocio → reglas de integridad → reglas de generación → relaciones entre módulos → escenarios obligatorios → casos que debe evitar → validaciones → orden de generación → criterios de calidad → revisión final del SQL.**

Así el resultado debería ser una BD de prueba **intencionalmente diseñada para comportarse como una instancia real de OperPan**, no simplemente una colección de registros aleatorios.
