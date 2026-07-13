import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("usa button como tipo seguro predeterminado", () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole("button", { name: "Guardar" }))
      .toHaveAttribute("type", "button");
  });

  it("conserva atributos nativos", () => {
    render(<Button disabled variant="primary">Publicar</Button>);
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
  });
});
