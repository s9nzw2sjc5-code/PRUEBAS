import { useFeatureSupport } from "@canva/app-hooks";
import { addPage } from "@canva/design";
import { fireEvent, waitFor } from "@testing-library/react";
import { App } from "../app";
import { renderInTestProvider } from "../../../utils/test_render";

jest.mock("@canva/app-hooks");

describe("App", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(useFeatureSupport).mockReturnValue(() => true);
    jest.mocked(addPage).mockResolvedValue({ type: "unsupported" });
  });

  it("crea una hoja A4 de marcos vacíos para chapas", async () => {
    const app = renderInTestProvider(<App />);

    fireEvent.click(app.getByRole("button", { name: "Crear 1 página" }));

    await waitFor(() => expect(addPage).toHaveBeenCalledTimes(1));
    const opciones = jest.mocked(addPage).mock.calls[0]?.[0];
    expect(opciones?.dimensions?.width).toBeCloseTo(793.7, 0);
    expect(opciones?.title).toBe("Chapas 58 mm · A4");
    expect(
      await app.findByText("Listo: se ha añadido 1 página al diseño."),
    ).toBeTruthy();
  });

  it("no deja crear páginas si el diseño no lo permite", () => {
    jest.mocked(useFeatureSupport).mockReturnValue(() => false);
    const app = renderInTestProvider(<App />);

    fireEvent.click(app.getByRole("button", { name: "Crear 1 página" }));

    expect(addPage).not.toHaveBeenCalled();
    expect(
      app.getByText(/Este tipo de diseño no permite añadir páginas/),
    ).toBeTruthy();
  });
});
