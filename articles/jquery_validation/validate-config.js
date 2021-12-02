$.validator.addMethod(
  "alphaNum",
  function (value, element) {
    return this.optional(element) || /^([a-zA-Z0-9]+)$/.test(value);
  },
  "半角英数字を入力してください"
);

$("#form_id").validate({
  rules: {
    text_name: {
      required: true,
    },
    email: {
      required: true,
      email: true,
    },
    password: {
      required: true,
      minlength: 8,
      alphaNum: true,
    },
  },
  messages: {
    text_name: {
      required: "入力必須項目です",
    },
    email: {
      required: "メールアドレスを入力してください",
      email: "有効なメールアドレスを入力してください",
    },
    password: {
      required: "パスワードが未入力です",
      minlength: "8文字以上必要です",
    },
  },
  errorClass: "validation-error",
  errorElement: "span",
  errorPlacement: function (error, element) {
    error.appendTo(element.data("error_place"));
  },
});
