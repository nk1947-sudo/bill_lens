import streamlit as st

from medbill_advocate.config import (
    PROVIDER_PRESETS,
    SUPPORTED_IMAGE_TYPES,
    SUPPORTED_UPLOAD_TYPES,
    ModelSettings,
    default_settings_for_preset,
)
from medbill_advocate.extraction import extract_uploaded_bill_text
from medbill_advocate.extraction import get_file_extension
from medbill_advocate.llm import analyze_bill
from medbill_advocate.llm import build_client
from medbill_advocate.llm import create_patient_action_plan


def show_sidebar() -> ModelSettings:
    st.sidebar.header("Model Settings")
    provider = st.sidebar.selectbox(
        "Quick provider preset",
        list(PROVIDER_PRESETS.keys()),
    )
    default_settings = default_settings_for_preset(PROVIDER_PRESETS[provider])

    api_key = st.sidebar.text_input(
        "API key",
        value=default_settings.api_key,
        type="password",
    )
    base_url = st.sidebar.text_input("Base URL", value=default_settings.base_url)
    text_model = st.sidebar.text_input("Text model", value=default_settings.text_model)
    vision_model = st.sidebar.text_input("Vision model", value=default_settings.vision_model)

    st.sidebar.caption(
        "Use cloud-hosted open-weight models only. Together AI is the safest default "
        "for image bills because it commonly exposes Llama vision models."
    )
    return ModelSettings(
        api_key=api_key,
        base_url=base_url,
        text_model=text_model,
        vision_model=vision_model,
    )


def main() -> None:
    st.set_page_config(page_title="MedBill Advocate", page_icon="MB", layout="wide")

    st.title("MedBill Advocate")
    st.subheader("Turn confusing medical bills into clear questions and a negotiation script.")

    st.info(
        "Prototype disclaimer: this tool is for education and hackathon demo purposes. "
        "It is not medical, legal, financial, or insurance advice."
    )

    model_settings = show_sidebar()

    uploaded_file = st.file_uploader(
        "Upload a medical bill as a PDF or image",
        type=SUPPORTED_UPLOAD_TYPES,
    )

    if not uploaded_file:
        st.write(
            "Upload a fake or redacted medical bill to see suspicious charges, "
            "plain-English explanations, and a ready-to-use phone script."
        )
        return

    if st.button("Analyze Bill", type="primary"):
        if not model_settings.api_key.strip():
            st.error("Enter an API key in the sidebar before analyzing a bill.")
            return
        if not model_settings.base_url.strip():
            st.error("Enter a Base URL in the sidebar.")
            return
        if not model_settings.text_model.strip():
            st.error("Enter a text model in the sidebar.")
            return
        extension = get_file_extension(uploaded_file.name)
        if extension in SUPPORTED_IMAGE_TYPES and not model_settings.vision_model.strip():
            st.error("Enter a vision model in the sidebar for image uploads.")
            return

        client = build_client(model_settings)

        try:
            with st.spinner("Extracting bill text..."):
                bill_text = extract_uploaded_bill_text(
                    uploaded_file,
                    client,
                    model_settings.vision_model,
                )

            if not bill_text.strip():
                st.error(
                    "No readable text was found. Try a clearer image, a text-based PDF, "
                    "or paste the bill into a generated PDF for the demo."
                )
                return

            with st.expander("Extracted bill text", expanded=False):
                st.text_area("Text sent to the analyst", bill_text, height=260)

            with st.spinner("Agent 1 is reviewing suspicious charges..."):
                analyst_findings = analyze_bill(
                    client,
                    bill_text,
                    model_settings.text_model,
                )

            st.warning(f"Agent 1: Billing Analyst findings\n\n{analyst_findings}")

            with st.spinner("Agent 2 is writing a patient action plan..."):
                patient_plan = create_patient_action_plan(
                    client,
                    analyst_findings,
                    model_settings.text_model,
                )

            st.success(f"Agent 2: Patient Advocate action plan\n\n{patient_plan}")

        except Exception as exc:
            st.error(str(exc))
            st.caption(
                "Tip: confirm that your model name is available for your provider and "
                "that image uploads use a vision-capable open-weight model."
            )


if __name__ == "__main__":
    main()
