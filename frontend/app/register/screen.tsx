"use client";
import PuntoScreen from "../punto-screen";
import { formPanel, passwordInput } from "../shared/form-panel";

function registerForm() {
  return formPanel(
    "Crear cuenta",
    `<form class="account-form" data-form="register">
      <div class="form-field"><label for="new-user">Nombre de usuario</label><input id="new-user" name="username" minlength="3" maxlength="30" pattern="[A-Za-z0-9_.]+" autocomplete="username" required /></div>
      <div class="form-field"><label for="new-email">Email</label><input id="new-email" name="email" type="email" autocomplete="email" required /></div>
      <div class="form-field">
        <label for="new-password">Contraseña</label>
        ${passwordInput("new-password", `<input id="new-password" name="clave" type="password" minlength="8" maxlength="128" pattern="(?=.*\\p{Lu})(?=.*[0-9])(?=.*[\\p{P}\\p{S}]).*" autocomplete="new-password" aria-describedby="password-requirements" title="Al menos 8 caracteres, una mayúscula, un número y un carácter especial" required />`)}
        <p class="form-help" id="password-requirements">Usá al menos 8 caracteres, una mayúscula, un número y un carácter especial, como ! o #.</p>
      </div>
      <button class="btn btn-primary" type="submit">Crear cuenta</button>
    </form>
    <a class="btn btn-outline account-switch" href="/login">¿Ya tenés una cuenta? Iniciá sesión</a>`,
    true,
  );
}

export default function Screen() {
  return <PuntoScreen view="register" renderScreen={registerForm} />;
}
